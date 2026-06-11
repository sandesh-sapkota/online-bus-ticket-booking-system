import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  completePaymentValidator,
  getPaymentDataValidator,
} from './payments.zodValidator';
import {
  BookedSeat,
  Booking,
  Bus,
  Payment,
  Route,
  Schedule,
  User,
} from '@prisma/client';
import { customExpressInterface } from 'src/users/users.guard';
import { SendMailToProvideConfirmedTicketsAfterPayment } from 'src/nodemailerMailFunctions';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { cloudinaryConfig, uploadedImageInterface } from 'src/cloudinaryConfig';

// type interface declaration for the Get Payment Data's data property in it's response body
export interface getPaymentDataOutputDataPropertyInterface {
  bookingId: string;
  totalPrice: number;
  bookingStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  journeyDate: Date;
  paymentId: string;
  paymentMethod: 'ONLINE' | 'CASH';
  referenceCode: string;
  paymentStatus: 'SUCCESS' | 'REFUNDED';
  paymentDate: Date;
}

// shape of Khalti's initiate success response
interface KhaltiInitiateResponse {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
}

// shape of Khalti's lookup (verification) response
interface KhaltiLookupResponse {
  pidx: string;
  total_amount: number;
  status:
    | 'Completed'
    | 'Pending'
    | 'Initiated'
    | 'Refunded'
    | 'Expired'
    | 'User canceled'
    | string;
  transaction_id: string | null;
  fee: number;
  refunded: boolean;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // ---- Khalti configuration helpers -------------------------------------

  private khaltiBaseUrl(): string {
    // Sandbox: https://dev.khalti.com/api/v2  |  Production: https://khalti.com/api/v2
    return (
      process.env.KHALTI_BASE_URL?.replace(/\/+$/, '') ||
      'https://dev.khalti.com/api/v2'
    );
  }

  private frontendUrl(): string {
    return (
      process.env.FRONTEND_URL?.replace(/\/+$/, '') || 'http://localhost:5173'
    );
  }

  private khaltiHeaders(): Record<string, string> {
    return {
      Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  // ---- Shared booking finalizer -----------------------------------------

  // Records a successful payment, marks the booking PAID, and (best-effort)
  // generates the ticket PDF + emails it. The money-critical steps (payment
  // record + PAID status) always run; PDF/email failures are logged, not fatal.
  private async finalizePaidBooking(
    user: User,
    booking: Booking,
    method: 'ONLINE' | 'CASH',
    referenceCode: string,
  ): Promise<string> {
    const createPayment: Payment = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        method,
        referenceCode,
        status: 'SUCCESS',
      },
    });

    // Confirm the seats by marking the booking as paid.
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'PAID' },
    });

    // Best-effort ticket generation + email. Never block a captured payment.
    try {
      const retrievedBookedSeats: BookedSeat | null =
        await this.prisma.bookedSeat.findFirst({
          where: { bookingId: booking.id },
        });
      const schedule: Schedule | null = await this.prisma.schedule.findUnique({
        where: { id: booking.scheduleId },
      });
      const bus: Bus | null = await this.prisma.bus.findUnique({
        where: { id: schedule?.busId },
      });
      const route: Route | null = await this.prisma.route.findUnique({
        where: { id: schedule?.routeId },
      });

      const doc = new PDFDocument();
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const tempPath = path.join(
        tempDir,
        `/ticket_${createPayment.id}_${Date.now()}.pdf`,
      );
      const writeStream = fs.createWriteStream(tempPath);
      doc.pipe(writeStream);

      doc.fontSize(20).text('Ticket Invoice', { underline: true }).moveDown();
      doc.fontSize(14).text(`Customer: ${user.firstName} ${user.lastName}`);
      doc.text(`Email: ${user.email}`);
      doc.text(`Phone: ${user.phoneNumber}`);
      doc.moveDown();
      if (bus) {
        doc.text(`Bus: ${bus.busRegistrationNumber}`);
        doc.text(`Type: ${bus.busType}`);
        doc.text(`Class: ${bus.class}`);
        doc.text(`Ticket Price: ${bus.farePerTicket}`);
        doc.moveDown();
      }
      if (route) {
        doc.text(`Route: ${route.origin} -> ${route.destination}`);
        doc.text(`Estimated Time: ${route.estimatedTimeInMin} min`);
        doc.moveDown();
      }
      doc.text(`Journey Date: ${booking.journeyDate}`);
      if (retrievedBookedSeats) {
        doc.text(`Seats: ${JSON.stringify(retrievedBookedSeats.seatNumbers)}`);
      }
      doc.text(`Total Price: ${booking.totalPrice}`);
      doc.moveDown();
      doc.text(`Payment Method: ${createPayment.method}`);
      doc.text(`Reference id: ${createPayment.referenceCode}`);
      doc.text(`Booking id: ${booking.id}`);
      doc.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(tempPath));
        writeStream.on('error', reject);
      });

      const uploadPdfResult: uploadedImageInterface =
        await cloudinaryConfig.uploader.upload(tempPath, {
          resource_type: 'auto',
        });
      await fs.promises.unlink(tempPath);

      await this.prisma.ticket.create({
        data: {
          bookingId: booking.id,
          ticketPdfUrl: uploadPdfResult.secure_url,
        },
      });

      await SendMailToProvideConfirmedTicketsAfterPayment(
        user,
        uploadPdfResult.secure_url,
      );
    } catch (error) {
      console.warn(
        `Ticket/email generation failed for booking ${booking.id} (payment ${createPayment.id} still recorded):`,
        error,
      );
    }

    return createPayment.id;
  }

  // ---- Khalti: initiate a payment ---------------------------------------

  // Creates a Khalti payment session for a booking and returns the payment_url
  // the client should redirect the user to.
  async initiateKhaltiPaymentService(
    request: customExpressInterface,
    params: any,
  ): Promise<{
    status: string;
    message: string;
    data: { pidx: string; payment_url: string; expires_in: number };
  }> {
    const bookingId: string = params?.bookingId;
    if (!bookingId) {
      throw new BadRequestException({
        status: 'error',
        message: 'Booking id is required.',
      });
    }

    if (!process.env.KHALTI_SECRET_KEY) {
      throw new InternalServerErrorException({
        status: 'error',
        message:
          'Khalti is not configured on the server. Set KHALTI_SECRET_KEY in the environment.',
      });
    }

    const booking: Booking | null = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException({
        status: 'error',
        message: 'No booking found with the provided booking id.',
      });
    }
    if (booking.userId !== request.foundExistingUser.id) {
      throw new ForbiddenException({
        status: 'error',
        message: 'Invalid option for payment.',
      });
    }
    if (booking.status === 'PAID') {
      throw new ConflictException({
        status: 'error',
        message: 'The booking has already been paid.',
      });
    }

    const user = request.foundExistingUser;
    const payload = {
      return_url: `${this.frontendUrl()}/payment/callback`,
      website_url: this.frontendUrl(),
      amount: booking.totalPrice * 100, // Khalti expects paisa
      purchase_order_id: booking.id,
      purchase_order_name: `Bus booking ${booking.id.slice(0, 8)}`,
      customer_info: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phoneNumber,
      },
    };

    let response: Response;
    try {
      response = await fetch(`${this.khaltiBaseUrl()}/epayment/initiate/`, {
        method: 'POST',
        headers: this.khaltiHeaders(),
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Could not reach Khalti. Please try again.',
      });
    }

    const data = (await response.json()) as KhaltiInitiateResponse & {
      [k: string]: any;
    };

    if (!response.ok || !data.payment_url) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed to initiate Khalti payment.',
        errors: data,
      });
    }

    return {
      status: 'success',
      message: 'Khalti payment initiated.',
      data: {
        pidx: data.pidx,
        payment_url: data.payment_url,
        expires_in: data.expires_in,
      },
    };
  }

  // ---- Khalti: verify a payment (lookup) and confirm the booking --------

  async verifyKhaltiPaymentService(
    request: customExpressInterface,
    requestBody: any,
  ): Promise<{
    status: string;
    message: string;
    data: { paymentId: string; status: string };
  }> {
    const bookingId: string = requestBody?.bookingId;
    const pidx: string = requestBody?.pidx;
    if (!bookingId || !pidx) {
      throw new BadRequestException({
        status: 'error',
        message: 'Both bookingId and pidx are required.',
      });
    }

    if (!process.env.KHALTI_SECRET_KEY) {
      throw new InternalServerErrorException({
        status: 'error',
        message:
          'Khalti is not configured on the server. Set KHALTI_SECRET_KEY in the environment.',
      });
    }

    const booking: Booking | null = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException({
        status: 'error',
        message: 'No booking found with the provided booking id.',
      });
    }
    if (booking.userId !== request.foundExistingUser.id) {
      throw new ForbiddenException({
        status: 'error',
        message: 'Invalid option for payment.',
      });
    }

    // Idempotency: if it's already confirmed, return the existing payment.
    if (booking.status === 'PAID') {
      const existing: Payment | null = await this.prisma.payment.findFirst({
        where: { bookingId: booking.id },
        orderBy: { createdAt: 'desc' },
      });
      return {
        status: 'success',
        message: 'Booking is already confirmed.',
        data: { paymentId: existing?.id ?? '', status: 'Completed' },
      };
    }

    // Ask Khalti for the authoritative status of this payment.
    let response: Response;
    try {
      response = await fetch(`${this.khaltiBaseUrl()}/epayment/lookup/`, {
        method: 'POST',
        headers: this.khaltiHeaders(),
        body: JSON.stringify({ pidx }),
      });
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Could not reach Khalti for verification. Please try again.',
      });
    }

    const data = (await response.json()) as KhaltiLookupResponse & {
      [k: string]: any;
    };

    if (!response.ok) {
      throw new BadRequestException({
        status: 'error',
        message: 'Khalti verification failed.',
        errors: data,
      });
    }

    if (data.status !== 'Completed') {
      throw new BadRequestException({
        status: 'error',
        message: `Payment not completed. Khalti status: ${data.status}.`,
      });
    }

    // Defense in depth: confirm the paid amount matches the booking total.
    if (data.total_amount !== booking.totalPrice * 100) {
      throw new ConflictException({
        status: 'error',
        message: 'Paid amount does not match the booking total.',
      });
    }

    const paymentId = await this.finalizePaidBooking(
      request.foundExistingUser,
      booking,
      'ONLINE',
      data.transaction_id ?? pidx,
    );

    return {
      status: 'success',
      message: 'Payment verified and booking confirmed.',
      data: { paymentId, status: data.status },
    };
  }

  // ---- Manual / cash completion (existing flow) -------------------------

  async completePaymentService(
    request: customExpressInterface,
    requestData: any,
  ): Promise<{
    status: string;
    message: string;
    data: { paymentId: string };
  }> {
    const validatedData = completePaymentValidator.safeParse({
      bookingId: requestData.params.bookingId,
      method: requestData.requestBody.method,
      amount: requestData.requestBody.amount,
      referenceCode: requestData.requestBody.referenceCode,
    });

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    const checkBookingExists: Booking | null =
      await this.prisma.booking.findUnique({
        where: { id: validatedData.data.bookingId },
      });

    if (!checkBookingExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No bookings found with the provided booking id.',
      });
    }

    if (checkBookingExists.userId !== request.foundExistingUser.id) {
      throw new ForbiddenException({
        status: 'error',
        message: 'Invalid option for payment.',
      });
    }

    if (checkBookingExists.status === 'PAID') {
      throw new ConflictException({
        status: 'error',
        message: 'The bookings has already been paid.',
      });
    }

    if (checkBookingExists.totalPrice !== validatedData.data.amount) {
      throw new ConflictException({
        status: 'error',
        message: `Invalid amount selected for payment, correct amount is ${checkBookingExists.totalPrice} taka.`,
      });
    }

    const paymentId = await this.finalizePaidBooking(
      request.foundExistingUser,
      checkBookingExists,
      validatedData.data.method,
      validatedData.data.referenceCode,
    );

    return {
      status: 'success',
      message:
        'Your payment has been successfully processed, tickets have been sent to your email.',
      data: { paymentId },
    };
  }

  //  this get payment data lets an user get data of their compelted payment on one of their booked seats
  async getPaymentDataService(params: any): Promise<{
    status: string;
    message: string;
    data: getPaymentDataOutputDataPropertyInterface;
  }> {
    const validatedData = getPaymentDataValidator.safeParse(params);

    if (!validatedData.success) {
      throw new BadRequestException({
        status: 'error',
        message: 'Failed in type validation.',
        errors: validatedData.error.errors,
      });
    }

    const checkPaymentExists: Payment | null =
      await this.prisma.payment.findUnique({
        where: { id: validatedData.data.paymentId },
      });

    if (!checkPaymentExists) {
      throw new NotFoundException({
        status: 'error',
        message: 'No payment found with the provided payment id.',
      });
    }

    const retrievedBookingDocument: Booking | null =
      await this.prisma.booking.findUnique({
        where: { id: checkPaymentExists.bookingId },
      });

    if (!retrievedBookingDocument) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }

    try {
      return {
        status: 'success',
        message: 'Payment data has been retrieved successfully.',
        data: {
          bookingId: retrievedBookingDocument.id,
          totalPrice: retrievedBookingDocument.totalPrice,
          bookingStatus: retrievedBookingDocument.status,
          journeyDate: retrievedBookingDocument.journeyDate,
          paymentId: checkPaymentExists.id,
          paymentMethod: checkPaymentExists.method,
          referenceCode: checkPaymentExists.referenceCode,
          paymentStatus: checkPaymentExists.status,
          paymentDate: checkPaymentExists.createdAt,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Something went wrong.',
      });
    }
  }
}
