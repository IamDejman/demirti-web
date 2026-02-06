import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { execFile } from 'child_process';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);

export async function generateCertificatePdf({ name, track, cohort, issuedAt, certificateNumber }) {
  const scriptPath = path.join(process.cwd(), 'scripts', 'generate_certificate.py');
  const outputPath = path.join(os.tmpdir(), `certificate-${certificateNumber}.pdf`);
  const issuedDate = issuedAt ? new Date(issuedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  await execFileAsync('python3', [
    scriptPath,
    '--output',
    outputPath,
    '--name',
    name || 'Learner',
    '--track',
    track || 'CVERSE Academy',
    '--cohort',
    cohort || '',
    '--date',
    issuedDate,
    '--number',
    certificateNumber,
  ]);
  const buffer = await fs.readFile(outputPath);
  return { outputPath, buffer };
}
