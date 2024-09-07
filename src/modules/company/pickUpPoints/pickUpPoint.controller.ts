import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TransformInterceptor } from '../../../interceptors/response.interceptor';
import { ResponseMessage } from '../../../decorators/response_message.decorator';
import { AuthGuard } from '../../../guards';
import { UUID } from 'crypto';
import { ApiTags } from '@nestjs/swagger';
import { PickUpPointService } from 'src/modules/company/pickUpPoints/pickUpPoint.service';
import { PickUpPointDto } from 'src/modules/company/dto/PickUpPoint.dto';

@ApiTags('Pick-Up Points')
@UseInterceptors(TransformInterceptor)
@Controller('company')
export class PickUpPointController {
  constructor(private readonly pickUpPointService: PickUpPointService) {}

  @Post('/:id/pickUpPoint')
  @UseGuards(AuthGuard)
  @ResponseMessage('PickUp Point creado con exito!')
  async create(
    @Param('id') id: UUID,
    @Body() body: PickUpPointDto,
  ): Promise<PickUpPointDto> {
    const branch = await this.pickUpPointService.createPickUpPoint(id, body);
    return branch;
  }

  // GET ALL PICK-UP POINTS FOR COMPANY
  @Get(':id/pickUpPoint')
  @UseGuards(AuthGuard)
  @ResponseMessage('PickUp Points encontrados con exito!')
  async get(@Param('id') id: UUID): Promise<PickUpPointDto[]> {
    const pickUpPoints = await this.pickUpPointService.getPickUpPoints(id);
    return pickUpPoints;
  }

  @Patch('/pickUpPoint/:id')
  @UseGuards(AuthGuard)
  @ResponseMessage('PickUp Point modificado con exito!')
  async update(
    @Param('id') id: UUID,
    @Body() body: any,
  ): Promise<PickUpPointDto> {
    const pickUpPoint = await this.pickUpPointService.updatePickUpPoint(
      id,
      body,
    );
    return pickUpPoint;
  }

  @Delete('/pickUpPoint/:id')
  @UseGuards(AuthGuard)
  @ResponseMessage('PickUp Point borrado con exito!')
  async delete(@Param('id') id: UUID): Promise<void> {
    await this.pickUpPointService.deletePickUpPoint(id);
    return;
  }
}
