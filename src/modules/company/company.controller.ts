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
import {
  BranchesResponseDto,
  CreateBranchDto,
  CreateBranchResponseDto,
  CreateCompanyDto,
  UpdateBranchDto,
  UpdateCompanyDto,
} from './dto';
import { TransformInterceptor } from '../../interceptors/response.interceptor';
import { ResponseMessage } from '../../decorators/response_message.decorator';
import { AuthGuard } from '../../guards';
import { Company } from '../../modules/company/company.entity';
import { CompanyService } from '../../modules/company/company.service';
import { Branch } from '../../modules/company/branch.entity';
import { UUID } from 'crypto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Companias')
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

  // CREATE BRANCH
  @Post(':id/branch')
  @UseGuards(AuthGuard)
  @ResponseMessage('Sucursal creada con exito!')
  async createBranch(
    @Param('id') id: UUID,
    @Body() body: CreateBranchDto,
  ): Promise<CreateBranchResponseDto> {
    const branch = await this.companyService.createBranch(id, body);
    return branch;
  }

  // GET ALL BRANCHES FOR COMPANY
  @Get(':id/branch')
  @UseGuards(AuthGuard)
  @ResponseMessage('Sucursales encontradas con exito!')
  async getBranches(@Param('id') id: UUID): Promise<BranchesResponseDto> {
    const branches = await this.companyService.getBranches(id);
    return branches;
  }

  @Patch('/branch/:id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Sucursal modificada con exito!')
  async updateBranch(
    @Param('id') id: UUID,
    @Body() body: UpdateBranchDto,
  ): Promise<Branch> {
    const branch = await this.companyService.updateBranch(id, body);
    return branch;
  }
}
