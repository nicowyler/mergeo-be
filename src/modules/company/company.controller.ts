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
import {
  BranchesResponseDto,
  CreateBranchDto,
  CreateBranchResponseDto,
  CreateCompanyDto,
  UpdateCompanyDto,
} from './dto';
import { TransformInterceptor } from '../../interceptors/response.interceptor';
import { ResponseMessage } from '../../decorators/response_message.decorator';
import { AuthGuard } from '../../guards';
import { Branch } from './entities/branch.entity';
import { UUID } from 'crypto';
import { ApiTags } from '@nestjs/swagger';
import { ErrorMessages } from 'src/common/enum';
import { Company } from 'src/modules/company/entities/company.entity';
import { CompanyService } from 'src/modules/company/services/company.service';
import { BranchService } from 'src/modules/company/services/branches.service';
import { ClientBlackListService } from 'src/modules/company/services/blackList.service';

@ApiTags('Companias')
@UseInterceptors(TransformInterceptor)
@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly branchService: BranchService,
    private readonly clientBlackListService: ClientBlackListService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @ResponseMessage('Compania creada con exito!')
  async createCompany(
    @Body() body: CreateCompanyDto,
  ): Promise<{ company: Company; branch: Omit<Branch, 'company'> }> {
    const company = await this.companyService.createCompany(body);
    return {
      company: company.company,
      branch: company.branch,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Compania encontrada!')
  async getCompany(@Param('id') id: UUID): Promise<Company> {
    const company = await this.companyService.getCompanyById(id);
    return company;
  }

  @Get('/cuit/:cuit')
  @UseGuards(AuthGuard)
  @ResponseMessage('Compania encontrada!')
  async getCompanyByCuit(@Param('cuit') cuit: number): Promise<Company> {
    const company = await this.companyService.getCompanyByCuit(cuit);
    return company;
  }

  @Patch(':id')
  @ResponseMessage('Compania actualizada con exito!')
  @UseGuards(AuthGuard)
  async editUser(
    @Param('id') companyId: UUID,
    @Body() body: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.companyService.updateCompany(companyId, body);
    if (company) return company;
    else throw new Error(ErrorMessages.COMPANY_NOT_FOUND);
  }

  // CREATE BRANCH
  @Post('/:id/branch')
  @UseGuards(AuthGuard)
  @ResponseMessage('Sucursal creada con exito!')
  async createBranch(
    @Param('id') id: UUID,
    @Body() body: CreateBranchDto,
  ): Promise<CreateBranchResponseDto> {
    const branch = await this.branchService.createBranch(id, body);
    return branch;
  }

  // GET ALL BRANCHES FOR COMPANY
  @Get(':id/branch')
  @UseGuards(AuthGuard)
  @ResponseMessage('Sucursales encontradas con exito!')
  async getBranches(@Param('id') id: UUID): Promise<BranchesResponseDto> {
    const branches = await this.branchService.getBranches(id);
    return branches;
  }

  @Patch('/branch/:id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Sucursal modificada con exito!')
  async updateBranch(
    @Param('id') id: UUID,
    @Body() body: any,
  ): Promise<Branch> {
    const branch = await this.branchService.updateBranch(id, body);
    return branch;
  }

  @Delete('/branch/:id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Sucursal borrada con exito!')
  async deleteBranch(@Param('id') branchId: UUID): Promise<void> {
    await this.branchService.deleteBranch(branchId);
    return;
  }

  // BLACKLIST
  @Get('/blacklist/:companyId')
  @UseGuards(AuthGuard)
  @ResponseMessage('Clientes en la blacklist!')
  async getBlackList(@Param('companyId') companyId: UUID) {
    return this.clientBlackListService.find(companyId);
  }

  @Post('/blacklist/:companyId')
  @UseGuards(AuthGuard)
  @ResponseMessage('Producto agregado a la blacklist con exito!')
  async addProductToBlackList(
    @Param('companyId') companyId: UUID,
    @Body() body: UUID[],
  ) {
    return this.clientBlackListService.add(companyId, body);
  }

  @Post('/blacklist/:companyId/remove')
  @UseGuards(AuthGuard)
  @ResponseMessage('Removido de la blacklist!')
  async removeFormBlackList(
    @Param('companyId') companyId: UUID,
    @Body() body: UUID[],
  ) {
    return this.clientBlackListService.remove(companyId, body);
  }
}
