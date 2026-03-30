import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegulationDto } from './dto/create-regulation.dto';

@Injectable()
export class RegulationsService {
  constructor(private prisma: PrismaService) {}

  /** Parse rulesJson string back to object for API responses */
  private parseRulesJson(reg: any) {
    if (!reg) return reg;
    try {
      return {
        ...reg,
        rulesJson:
          typeof reg.rulesJson === 'string'
            ? JSON.parse(reg.rulesJson)
            : reg.rulesJson,
      };
    } catch {
      return { ...reg, rulesJson: {} };
    }
  }

  async create(dto: CreateRegulationDto) {
    const existing = await this.prisma.regulation.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException('Regulation code already exists');
    const rulesJsonStr = dto.rulesJson ? JSON.stringify(dto.rulesJson) : '{}';
    const reg = await this.prisma.regulation.create({
      data: {
        code: dto.code,
        rulesJson: rulesJsonStr,
        activeFrom: new Date(dto.activeFrom),
        pdfUrl: dto.pdfUrl,
      },
    });
    return this.parseRulesJson(reg);
  }

  async findAll() {
    const regs = await this.prisma.regulation.findMany({
      orderBy: { activeFrom: 'desc' },
    });
    return regs.map((r) => this.parseRulesJson(r));
  }

  async findOne(id: string) {
    const reg = await this.prisma.regulation.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Regulation not found');
    return this.parseRulesJson(reg);
  }

  async update(id: string, dto: Partial<CreateRegulationDto>) {
    await this.findOne(id);
    const data: any = {};
    if (dto.code) data.code = dto.code;
    if (dto.rulesJson) data.rulesJson = JSON.stringify(dto.rulesJson);
    if (dto.activeFrom) data.activeFrom = new Date(dto.activeFrom);
    if (dto.pdfUrl !== undefined) data.pdfUrl = dto.pdfUrl;
    const reg = await this.prisma.regulation.update({ where: { id }, data });
    return this.parseRulesJson(reg);
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      return await this.prisma.regulation.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete this regulation because it is linked to existing students, semesters, or subjects.',
        );
      }
      throw error;
    }
  }
}
