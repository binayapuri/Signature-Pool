import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getDb, saveDb, Envelope } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const title = data.get('title') as string || 'Untitled Envelope';
    const signersRaw = data.get('signers') as string;
    
    // Validate signers
    let signers = [];
    if (signersRaw) {
      signers = JSON.parse(signersRaw);
    }
    if (signers.length === 0) {
      return NextResponse.json({ success: false, error: 'Must have at least one signer' }, { status: 400 });
    }

    const files = data.getAll('files') as File[];
    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'Must include at least one document' }, { status: 400 });
    }

    const documents = [];
    
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uniqueId = crypto.randomUUID();
      const ext = path.extname(file.name) || '';
      const filename = `${uniqueId}${ext}`;
      const targetPath = path.join(process.cwd(), '_uploads', filename);

      await writeFile(targetPath, buffer);
      
      documents.push({
        id: crypto.randomUUID(),
        filename,
        originalName: file.name
      });
    }

    // Format signers
    const formattedSigners = signers.map((s: any) => ({
      id: crypto.randomUUID(),
      name: s.name || 'Unknown',
      email: s.email || '',
      status: 'pending'
    }));

    const envelope: Envelope = {
      id: crypto.randomUUID(),
      title,
      createdAt: Date.now(),
      status: 'sent',
      documents,
      signers: formattedSigners,
      signatures: []
    };

    const db = getDb();
    db.envelopes.push(envelope);
    saveDb(db);

    // Dispatch emails if SMTP is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const hostUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        await Promise.all(envelope.signers.map(signer => {
           if (!signer.email) return Promise.resolve();
           const signLink = `${hostUrl}/sign/${envelope.id}/${signer.id}`;
           return transporter.sendMail({
              from: `"SecureVault" <${process.env.SMTP_USER}>`,
              to: signer.email,
              subject: `Action Required: Secure Signature Request - ${envelope.title}`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px;">
                  <h2 style="color: #111;">Hello ${signer.name},</h2>
                  <p>You have been requested to securely sign the documents for: <strong>${envelope.title}</strong>.</p>
                  <p>Please click the button below to enter the restricted viewing vault. This link is extremely private. Do not share it.</p>
                  <a href="${signLink}" style="display:inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 24px 0;">Enter Vault & Sign</a>
                  <p style="font-size: 12px; color: #888; margin-top: 30px;">Sent securely from your trusted Sender.</p>
                </div>
              `
           });
        }));
      } catch (mailError) {
         console.error('Mail dispatch failed:', mailError);
      }
    }

    return NextResponse.json({ success: true, envelopeId: envelope.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Failed to create envelope' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const db = getDb();
    return NextResponse.json({ success: true, envelopes: db.envelopes });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
