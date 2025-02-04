import { GenericFilter, SortOrder } from 'src/common/pagination/generic.filter';
import { FindOptionsWhere, Repository } from 'typeorm';

export class PageService {
  protected createOrderQuery(filter: GenericFilter) {
    const order: any = {};

    if (filter.orderBy) {
      order[filter.orderBy] = filter.sortOrder || SortOrder.ASC;
      return order;
    }

    order.created = SortOrder.DESC;
    return order;
  }

  protected paginate<T>(
    repository: Repository<T>,
    filter: GenericFilter,
    where: FindOptionsWhere<T>,
  ) {
    // Ensure valid pagination parameters
    const page = Math.max(1, filter.page || 1);
    const pageSize = Math.max(1, filter.pageSize || 10);
    const skip = (page - 1) * pageSize;

    return repository.findAndCount({
      order: this.createOrderQuery(filter),
      skip,
      take: pageSize,
      where: where,
      relations: ['company'], // Add this if you need company information
    });
  }
}
