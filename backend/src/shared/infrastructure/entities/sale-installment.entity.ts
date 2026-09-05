// shared/infrastructure/entities/sale-installment.entity.ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sale_installments')
export class SaleInstallmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sale_id' })
  saleId: number;

  @Column({ name: 'installment_no', type: 'int' })
  installmentNo: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ name: 'payment_id', nullable: true })
  paymentId: number;

  @Column({ length: 20, default: 'pendiente' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
