import { NextResponse } from 'next/server';
import { CATEGORIES } from '@/app/constants';

export async function GET() {
  return NextResponse.json({ categories: CATEGORIES });
}