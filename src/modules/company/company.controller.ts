import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateCompanyDto, UpdateCompanyDto } from './dto';
import { TransformInterceptor } from '@/interceptors/response.interceptor';
import { ResponseMessage } from '@/decorators/response_message.decorator';
import { AuthGuard } from '@/guards';
import { Company } from '@/modules/company/company.entity';
import { CompanyService } from '@/modules/company/company.service';

@UseInterceptors(TransformInterceptor)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ResponseMessage('Compania creada con exito!')
  async createCompany(@Body() body: CreateCompanyDto): Promise<Company> {
    const company = await this.companyService.createCompany(body);
    return company;
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Compania encontrada!')
  async getCompany(@Param('id') id: string): Promise<Company> {
    const company = await this.companyService.getCompanyById(id);
    return company;
  }

  @Patch(':id')
  @ResponseMessage('Compania actualizada!')
  @UseGuards(AuthGuard)
  async editUser(
    @Param('id') companyId: string,
    @Body() body: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.companyService.updateCompany(companyId, body);
    return company;
  }
}
