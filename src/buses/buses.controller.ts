import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  BusesService,
  GetBusesOutputDataPropertyClientInterface,
  GetBusOutputDataPropertyClientInterface,
  GetRoutesOutputDataPropertyClientInterface,
} from './buses.service';
import { AuthGuard } from 'src/users/users.guard';

@Controller('buses')
export class BusesController {
  constructor(private busesService: BusesService) {}

  // public endpoint that lists the available (bookable) routes for the client
  @Get('/routes')
  async getRoutes(): Promise<{
    status: string;
    message: string;
    data: GetRoutesOutputDataPropertyClientInterface[];
  }> {
    return this.busesService.getRoutesService();
  }

  // defining a controller function for retriving a list of buses based on provided client side queries
  @Get('/buses')
  async getBuses(@Query() requestQueries: any): Promise<{
    status: string;
    message: String;
    data: GetBusesOutputDataPropertyClientInterface[];
  }> {
    return this.busesService.getBusesService(requestQueries);
  }

  // defining a controller function for retriving all the informations that is related to the schedule and journey date from the client
  @Get('/bus')
  @UseGuards(AuthGuard)
  async getBus(@Query() requestQueries: any): Promise<{
    status: string;
    message: string;
    data: GetBusOutputDataPropertyClientInterface;
  }> {
    return this.busesService.getBusServiceBus(requestQueries);
  }
}
