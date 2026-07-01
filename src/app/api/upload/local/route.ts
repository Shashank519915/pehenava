import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Missing file key.' }, { status: 400 });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Read request body as arrayBuffer
    const buffer = Buffer.from(await request.arrayBuffer());
    const sanitizedKey = path.basename(key);
    const filePath = path.join(uploadDir, sanitizedKey);
    
    await fs.writeFile(filePath, buffer);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
