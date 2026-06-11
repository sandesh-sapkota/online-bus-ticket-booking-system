import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  getPaymentDataOutputDataPropertyInterface,
  PaymentsService,
} from './payments.service';
import { AuthGuard, customExpressInterface } from 'src/users/users.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentService: PaymentsService) {}

  // initiate a Khalti payment session for a booking; returns the payment_url to redirect to
  @Post('/khalti/initiate/:bookingId')
  @UseGuards(AuthGuard)
  async initiateKhalti(
    @Request() request: customExpressInterface,
    @Param() params: any,
  ): Promise<{
    status: string;
    message: string;
    data: { pidx: string; payment_url: string; expires_in: number };
  }> {
    return this.paymentService.initiateKhaltiPaymentService(request, params);
  }

  // verify a Khalti payment (lookup) after the callback and confirm the booking
  @Post('/khalti/verify')
  @UseGuards(AuthGuard)
  async verifyKhalti(
    @Request() request: customExpressInterface,
    @Body() requestBody: any,
  ): Promise<{
    status: string;
    message: string;
    data: { paymentId: string; status: string };
  }> {
    return this.paymentService.verifyKhaltiPaymentService(request, requestBody);
  }

  // this complete payment route will complete the payment of the user's booked seats through booked id
  @Post('/:bookingId')
  @UseGuards(AuthGuard)
  async completePayment(
    @Request() request: customExpressInterface,
    @Param() params: any,
    @Body() requestBody: any,
  ): Promise<{
    status: string;
    message: string;
    data: {
      paymentId: string;
    };
  }> {
    return this.paymentService.completePaymentService(request, {
      params,
      requestBody,
    });
  }

  //  this get payment data lets an user get data of their compelted payment on one of their booked seats
  @Get('/:paymentId')
  @UseGuards(AuthGuard)
  async getPaymentData(@Param() params: any): Promise<{
    status: string;
    message: string;
    data: getPaymentDataOutputDataPropertyInterface;
  }> {
    return await this.paymentService.getPaymentDataService(params);
  }
}
