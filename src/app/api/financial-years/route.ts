import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const years = await prisma.financialYear.findMany({
      orderBy: { startDate: 'asc' },
    });
    return NextResponse.json(years);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
