import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('Conectado ao banco de dados PostgreSQL');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export function getPrisma() {
  return prisma;
}
