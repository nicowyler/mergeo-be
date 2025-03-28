import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PickUpPointDto, UpdatePickUpPoint } from '../dto';
import { ErrorMessages } from '../../../common/enum/errorMessages.enum';
import { UUID } from 'crypto';
import { convertCoordinatesForPostGIS } from 'src/common/utils/postGis.utils';
import { PickUpPoint } from 'src/modules/company/pickUpPoints/pickUpPoint.entity';
import { PickUpSchedule } from 'src/modules/company/pickUpPoints/pickUpSchedule.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { Address } from 'src/modules/company/entities/address.entity';

@Injectable()
export class PickUpPointService {
  constructor(
    @InjectRepository(PickUpPoint)
    private readonly pickUpPointRepository: Repository<PickUpPoint>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(PickUpSchedule)
    private readonly pickUpScheduleRepository: Repository<PickUpSchedule>,
  ) {}

  async createPickUpPoint(
    companyId: string,
    pickUpPointDto: PickUpPointDto,
  ): Promise<Omit<PickUpPoint, 'company'>> {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId as UUID },
        relations: ['pickUpPoints'], // Include branches in the query
      });

      if (!company) {
        throw new NotFoundException(
          `${ErrorMessages.COMPANY_NOT_FOUND} ${companyId}`,
        );
      }

      const address = new Address();
      address.locationId = pickUpPointDto.address.id;
      address.name = pickUpPointDto.address.name;
      address.location = convertCoordinatesForPostGIS(
        pickUpPointDto.address.location.coordinates,
      );

      let schedules = [];
      if (pickUpPointDto.schedules.length) {
        schedules = pickUpPointDto.schedules.map((scheduleDto) => {
          const schedule = new PickUpSchedule();
          schedule.day = scheduleDto.day;
          schedule.startHour = scheduleDto.startHour;
          schedule.endHour = scheduleDto.endHour;
          return schedule;
        });
      }

      const savedAddress = await this.addressRepository.save(address);
      const pickUpPoint = new PickUpPoint();
      pickUpPoint.name = pickUpPointDto.name;
      pickUpPoint.email = pickUpPointDto.email;
      pickUpPoint.phoneNumber = pickUpPointDto.phoneNumber;
      pickUpPoint.company = company;
      pickUpPoint.address = savedAddress;
      pickUpPoint.schedules = schedules;

      const savedPickUpPoint = await this.pickUpPointRepository.save(
        pickUpPoint,
      );

      const pickUpPointWithoutCompany = {
        id: savedPickUpPoint.id,
        name: savedPickUpPoint.name,
        email: savedPickUpPoint.email,
        phoneNumber: savedPickUpPoint.phoneNumber,
        address: savedPickUpPoint.address,
        schedules: savedPickUpPoint.schedules,
      };

      return pickUpPointWithoutCompany;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(ErrorMessages.PICK_UP_POINT_NAME_TAKEN);
      } else {
        throw error;
      }
    }
  }

  async updatePickUpPoint(id: UUID, body: UpdatePickUpPoint) {
    try {
      // Find the branch and its related address
      const pickUpPoint = await this.pickUpPointRepository.findOne({
        where: { id },
        relations: ['address', 'schedules'],
      });

      if (!pickUpPoint) {
        throw new NotFoundException(
          `${ErrorMessages.PICK_UP_POINT_NOT_FOUND} ${id}`,
        );
      }

      // Update branch properties
      pickUpPoint.name = body.name ?? pickUpPoint.name;
      pickUpPoint.email = body.email ?? pickUpPoint.email;
      pickUpPoint.phoneNumber = body.phoneNumber ?? pickUpPoint.phoneNumber;

      const incomingSchedules = body.schedules;
      // Find schedules that need to be removed
      const schedulesToRemove = pickUpPoint.schedules.filter(
        (existingSchedule) =>
          !incomingSchedules.some(
            (schedule) => schedule.id === existingSchedule.id,
          ),
      );

      // Find schedules that need to be added or updated
      const updatedSchedules = incomingSchedules.map((scheduleDto) => {
        let schedule = pickUpPoint.schedules.find(
          (s) => s.id === scheduleDto.id,
        );

        if (!schedule) {
          // Schedule not found, create a new one
          schedule = new PickUpSchedule();
        }

        // Update fields
        schedule.day = scheduleDto.day;
        schedule.startHour = scheduleDto.startHour;
        schedule.endHour = scheduleDto.endHour;
        return schedule;
      });

      // Remove schedules that are not in the incoming data
      if (schedulesToRemove.length > 0) {
        await this.pickUpScheduleRepository.remove(schedulesToRemove);
      }

      // Update the schedules
      pickUpPoint.schedules = updatedSchedules;

      if (body.address) {
        const { id: locationId, location, ...addressData } = body.address;

        // Convert coordinates to PostGIS format
        const postGISPolygon = location
          ? convertCoordinatesForPostGIS(location.coordinates)
          : undefined;

        // Update the address data
        const updatedAddressData = {
          ...addressData,
          polygon: postGISPolygon,
        };

        // Check if an address with the given locationId exists
        let address = await this.addressRepository.findOne({
          where: { id: locationId },
        });

        if (address) {
          // Update existing address
          address = { ...address, ...updatedAddressData };
          address = await this.addressRepository.save(address);
        } else {
          // Create a new address if it does not exist
          address = await this.addressRepository.save({
            locationId,
            ...updatedAddressData,
          });
        }
      }

      // Save the updated branch
      const updatedPickUpPoint = await this.pickUpPointRepository.save(
        pickUpPoint,
      );

      const transformedPickUpPoint = {
        ...updatedPickUpPoint,
        address: updatedPickUpPoint.address, // Transform back
      };

      return transformedPickUpPoint;
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(`${ErrorMessages.BRANCH_NOT_FOUND} ${id}`);
      } else {
        throw error;
      }
    }
  }

  async getPickUpPoints(companyId: string): Promise<PickUpPointDto[]> {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId as UUID },
        relations: [
          'pickUpPoints',
          'pickUpPoints.address',
          'pickUpPoints.schedules',
        ],
      });

      if (!company) {
        throw new NotFoundException(ErrorMessages.COMPANY_NOT_FOUND);
      }
      return company.pickUpPoints;
    } catch (error) {
      throw error;
    }
  }

  async deletePickUpPoint(id: string) {
    try {
      const pickUpPoint = await this.pickUpPointRepository.find({
        where: { id: id },
        relations: ['address', 'schedules'], // Ensure address is included
      });
      if (!pickUpPoint) {
        throw new NotFoundException(ErrorMessages.PICK_UP_POINT_NOT_FOUND);
      }

      this.pickUpPointRepository.remove(pickUpPoint);
    } catch (error) {
      throw error;
    }
  }
}
