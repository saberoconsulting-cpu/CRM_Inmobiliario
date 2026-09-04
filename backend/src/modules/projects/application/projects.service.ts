// modules/projects/application/projects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { ProjectEntity } from '../../../shared/infrastructure/entities/project.entity';
import { BlockEntity } from '../../../shared/infrastructure/entities/block.entity';
import { LotEntity } from '../../../shared/infrastructure/entities/lot.entity';
import { PlanEntity } from '../../../shared/infrastructure/entities/plan.entity';
import { AuditLogEntity } from '../../../shared/infrastructure/entities/audit-log.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(LotEntity)
    private readonly lotRepo: Repository<LotEntity>,
    @InjectRepository(BlockEntity)
    private readonly blockRepo: Repository<BlockEntity>,
    @InjectRepository(PlanEntity)
    private readonly planRepo: Repository<PlanEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
  ) {}

  async audit(userId: number, action: string, entity?: string, entityId?: number) {
    await this.auditRepo.save({ userId, action, entity, entityId });
  }

  async create(dto: CreateProjectDto, actorId: number) {
    const project = this.projectRepo.create({
      name: dto.name,
      description: dto.description,
      location: dto.location,
      status: dto.status || 'active',
      latitude: dto.latitude != null ? String(dto.latitude) : null,
      longitude: dto.longitude != null ? String(dto.longitude) : null,
      referencePrice: dto.referencePrice != null ? String(dto.referencePrice) : null,
    } as DeepPartial<ProjectEntity>);
    const saved = await this.projectRepo.save(project);
    await this.audit(actorId, 'CREAR_PROYECTO', 'projects', saved.id);
    return saved;
  }

  async list() {
    const projects = await this.projectRepo.find({ order: { createdAt: 'DESC' } });
    const withStats = await Promise.all(
      projects.map(async (p) => {
        const [total, disponibles, reservados, adelantos, primeras, vendidos] =
          await Promise.all([
            this.lotRepo.count({ where: { projectId: p.id } }),
            this.lotRepo.count({ where: { projectId: p.id, status: 'disponible' } }),
            this.lotRepo.count({ where: { projectId: p.id, status: 'reservado' } }),
            this.lotRepo.count({ where: { projectId: p.id, status: 'adelanto' } }),
            this.lotRepo.count({ where: { projectId: p.id, status: 'primera_cuota' } }),
            this.lotRepo.count({ where: { projectId: p.id, status: 'vendido' } }),
          ]);
        return { ...p, stats: { total, disponibles, reservados, adelantos, primeras, vendidos } };
      }),
    );
    return withStats;
  }

  async getOne(id: number) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }

  async update(id: number, dto: CreateProjectDto, actorId: number) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    Object.assign(project, dto);
    if (dto.latitude != null) project.latitude = String(dto.latitude);
    if (dto.longitude != null) project.longitude = String(dto.longitude);
    if (dto.referencePrice != null) project.referencePrice = String(dto.referencePrice);
    const saved = await this.projectRepo.save(project);
    await this.audit(actorId, 'EDITAR_PROYECTO', 'projects', id);
    return saved;
  }

  async setStatus(id: number, status: 'active' | 'inactive', actorId: number) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    project.status = status;
    await this.projectRepo.save(project);
    await this.audit(actorId, 'ESTADO_PROYECTO', 'projects', id);
    return { ok: true };
  }

  async updateCover(id: number, coverImageUrl: string, actorId: number) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    project.coverImageUrl = coverImageUrl;
    await this.projectRepo.save(project);
    await this.audit(actorId, 'SUBIR_PORTADA', 'projects', id);
    return project;
  }

  // Detalle completo para el dashboard de proyecto
  async dashboard(id: number) {
    const project = await this.getOne(id);
    const plan = await this.planRepo.findOne({ where: { projectId: id } });
    const blocks = await this.blockRepo.find({ where: { projectId: id } });
    const lots = await this.lotRepo.find({ where: { projectId: id } });
    return { project, plan, blocks, lots };
  }
}