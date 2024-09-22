import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  Logger,
  UploadedFiles,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRentingDto } from '@renting/dto/create-renting.dto';
import { UpdateRentingDto } from '@renting/dto/update-renting.dto';
import { Renting } from '@renting/schemas/renting.schema';
import { RentingService } from '@renting/services/renting.service';
import { PaginatedResourceDto } from '@search/dto/paginated-resource.dto';
import {
  Filtering,
  FilteringParams,
} from '@shared/decorators/filtering.decorator';
import {
  Pagination,
  PaginationParams,
} from '@shared/decorators/pagination.decorator';
import { AwsStorageService } from '@storages/services/aws-storage.service';

@ApiTags('Rentings')
@Controller('renting')
@UseInterceptors(CacheInterceptor)
export class RentingController {
  private readonly logger = new Logger(RentingController.name);

  public constructor(
    private readonly rentingService: RentingService,
    private readonly awsStorage: AwsStorageService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: 'Create a rent' })
  @ApiConsumes('multipart/form-data')
  public async create(
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Body() rent: CreateRentingDto,
  ) {
    const imageUrls = await this.awsStorage.uploadMultipleFiles(images);
    const rentWithImages = { ...rent, images: imageUrls };
    return this.rentingService.create(rentWithImages);
  }

  @Get()
  @ApiOperation({ summary: 'Get rentings by filters' })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: 'Size of items per page',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'text',
    required: false,
    type: String,
    description: 'Text to search for',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Category to filter by',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successful retrieval of rentings',
    type: PaginatedResourceDto<Renting>,
  })
  public async getAllRentings(
    @PaginationParams() pagination: Pagination,
    @FilteringParams() filters: Filtering,
    @Query('text') text: string,
  ) {
    this.logger.debug(
      `Getting products with filters: ${JSON.stringify(filters)} and pagination: ${JSON.stringify(pagination)}`,
    );

    if (text)
      return this.rentingService.getRentingBySearchQuery(pagination, text);
    else return this.rentingService.getRentingByFilters(pagination, filters);
  }

  @Get(':id')
  getRenting(@Param('id') id: string) {
    return this.rentingService.getRentingById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRentingDto: UpdateRentingDto) {
    return this.rentingService.update(+id, updateRentingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rentingService.remove(+id);
  }
}
