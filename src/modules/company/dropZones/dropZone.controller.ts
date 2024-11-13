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
import { DropZoneService } from 'src/modules/company/dropZones/dropZone.service';
import {
  DropZoneDto,
  UpdateDropZoneDto,
} from 'src/modules/company/dto/DropZone.dto';

@ApiTags('DropZones')
@UseInterceptors(TransformInterceptor)
@Controller('company')
export class DropZoneController {
  constructor(private readonly dropZoneService: DropZoneService) {}

  @Post('/:id/dropZone')
  @UseGuards(AuthGuard)
  @ResponseMessage('Drop zone creado con exito!')
  async create(
    @Param('id') id: UUID,
    @Body() body: DropZoneDto,
  ): Promise<DropZoneDto> {
    const dropZone = await this.dropZoneService.create(id, body);
    return dropZone;
  }

  // GET ALL DROP ZONES FOR COMPANY
  @Get(':id/dropZone')
  @UseGuards(AuthGuard)
  @ResponseMessage('Drop zone encontrados con exito!')
  async get(@Param('id') id: UUID): Promise<DropZoneDto[]> {
    const dropZones = await this.dropZoneService.getAll(id);
    return dropZones;
  }

  @Patch('/dropZone/:id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Drop zone Point modificado con exito!')
  async update(
    @Param('id') id: UUID,
    @Body() body: UpdateDropZoneDto,
  ): Promise<DropZoneDto> {
    const dropZone = await this.dropZoneService.update(id, body);
    return dropZone;
  }

  @Delete('/dropZone/:id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Drop zone borrado con exito!')
  async delete(@Param('id') id: UUID): Promise<void> {
    await this.dropZoneService.delete(id);
    return;
  }
}
