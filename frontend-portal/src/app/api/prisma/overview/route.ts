import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [merchant, intentsCount, recentIntents, outboxCount, recentDeliveries] = await Promise.all([
      prisma.merchant.findFirst({
        where: { id: '11111111-1111-1111-1111-111111111111' },
        include: {
          apiKeys: true,
          ledgerAccounts: true,
        },
      }),
      prisma.paymentIntent.count(),
      prisma.paymentIntent.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.outboxEvent.count(),
      prisma.webhookDelivery.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Convert BigInt to Number for JSON serialization
    const serializedIntents = recentIntents.map((intent) => ({
      ...intent,
      amount: Number(intent.amount),
    }));

    return NextResponse.json({
      success: true,
      engine: 'Prisma ORM (Direct PostgreSQL connection)',
      merchant: merchant
        ? {
            id: merchant.id,
            businessName: merchant.businessName,
            email: merchant.email,
            apiKeysCount: merchant.apiKeys.length,
            ledgerAccounts: merchant.ledgerAccounts.map((acc) => ({
              code: acc.accountCode,
              name: acc.accountName,
              type: acc.accountType,
            })),
          }
        : null,
      stats: {
        totalIntents: intentsCount,
        outboxEvents: outboxCount,
        recentWebhooks: recentDeliveries.length,
      },
      transactions: serializedIntents,
      deliveries: recentDeliveries,
    });
  } catch (error) {
    console.error('Prisma query error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
