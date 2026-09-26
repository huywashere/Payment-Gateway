import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [merchant, intentsCount, recentIntents, outboxCount, recentDeliveries] = await Promise.all([
      prisma.merchant.findFirst({
        where: { id: '11111111-1111-1111-1111-111111111111' },
        include: {
          apiKeys: true,
          ledgerAccounts: {
            include: { debitEntries: true, creditEntries: true },
          },
        },
      }),
      prisma.paymentIntent.count({ where: { merchantId: '11111111-1111-1111-1111-111111111111' } }),
      prisma.paymentIntent.findMany({
        where: { merchantId: '11111111-1111-1111-1111-111111111111' },
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
      id: intent.id,
      amount: Number(intent.amount),
      currency: intent.currency,
      status: intent.status,
      description: intent.description ?? 'Thanh toán đơn hàng',
      createdAt: intent.createdAt.toISOString(),
      clientSecret: intent.clientSecret,
    }));

    const ledgerAccounts = merchant?.ledgerAccounts.map((account) => ({
      accountCode: account.accountCode,
      accountName: account.accountName,
      balance:
        account.creditEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) -
        account.debitEntries.reduce((sum, entry) => sum + Number(entry.amount), 0),
    })) ?? [];

    return NextResponse.json({
      success: true,
      engine: 'Prisma ORM (Direct PostgreSQL connection)',
      merchant: merchant
        ? {
            id: merchant.id,
            businessName: merchant.businessName,
            email: merchant.email,
            apiKeysCount: merchant.apiKeys.length,
          }
        : null,
      ledgerAccounts,
      stats: {
        totalIntents: intentsCount,
        totalOutboxEvents: outboxCount,
        totalWebhookDeliveries: recentDeliveries.length,
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
