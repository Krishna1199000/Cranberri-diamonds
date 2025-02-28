import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

export async function POST() {
  try {
    // Get the absolute path to the script
    const scriptPath = path.resolve(process.cwd(), 'prisma/sync-diamonds.js');
    
    // Execute the sync script directly with node
    execPromise(`node ${scriptPath}`);
    
    // Return immediately as the sync process runs in the background
    return NextResponse.json({
      message: 'Sync process started',
      started: true,
    });
  } catch (error) {
    console.error('Error starting sync process:', error);
    return NextResponse.json(
      { error: 'Failed to start sync process' },
      { status: 500 }
    );
  }
}