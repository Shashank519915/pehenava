import { PrismaClient, Role, TransactionType, PaymentMode, TransactionStatus, AccountType, PartyType, AuditEventType, NormalBalance } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to hash passwords consistently
const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, 12);
};

// Simple helper to simulate ULID (time-prefixed sortable string)
const generateUlid = (index: number) => {
  const timestamp = Date.now().toString(36).padStart(10, '0');
  const rand = Math.random().toString(36).substring(2, 10).padStart(8, '0');
  const seq = index.toString(36).padStart(8, '0');
  return `${timestamp}-${rand}-${seq}`.toUpperCase();
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean Database
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.correctionRequest.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.accountBalance.deleteMany();
  await prisma.account.deleteMany();
  await prisma.party.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.financialYear.deleteMany();

  // 2. Create Users
  console.log('👤 Creating users...');
  const adminPassword = hashPassword('AdminPehenava123!');
  const accountantPassword = hashPassword('AccountantPehenava123!');
  const maintainerPassword = hashPassword('MaintainerPehenava123!');
  const employeePassword = hashPassword('EmployeePehenava123!');
  const readOnlyPassword = hashPassword('ReadOnlyPehenava123!');

  const admin = await prisma.user.create({
    data: { email: 'admin@pehenava.in', name: 'Rajesh Singhania', passwordHash: adminPassword, role: Role.ADMIN },
  });
  const accountant = await prisma.user.create({
    data: { email: 'accountant@pehenava.in', name: 'Amit Sharma', passwordHash: accountantPassword, role: Role.ACCOUNTANT },
  });
  const maintainer = await prisma.user.create({
    data: { email: 'maintainer@pehenava.in', name: 'Vikram Malhotra', passwordHash: maintainerPassword, role: Role.MAINTAINER },
  });
  const employee = await prisma.user.create({
    data: { email: 'employee@pehenava.in', name: 'Sonia Verma', passwordHash: employeePassword, role: Role.EMPLOYEE },
  });
  const readOnly = await prisma.user.create({
    data: { email: 'readonly@pehenava.in', name: 'CA Alok Gupta', passwordHash: readOnlyPassword, role: Role.READ_ONLY },
  });

  // 3. Create Financial Years
  console.log('📅 Creating Financial Years (India: 1 April -> 31 March)...');
  const fy2425 = await prisma.financialYear.create({
    data: {
      name: 'FY 2024-25',
      startDate: new Date('2024-04-01T00:00:00Z'),
      endDate: new Date('2025-03-31T23:59:59Z'),
      isActive: false,
      isClosed: true,
    },
  });

  const fy2526 = await prisma.financialYear.create({
    data: {
      name: 'FY 2025-26',
      startDate: new Date('2025-04-01T00:00:00Z'),
      endDate: new Date('2026-03-31T23:59:59Z'),
      isActive: true,
      isClosed: false,
    },
  });

  // 4. Create Chart of Accounts
  console.log('📂 Creating Chart of Accounts...');
  const coaData = [
    { code: 'ACC-SALES', name: 'Sales A/c', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, isSystem: true },
    { code: 'ACC-PURCHASES', name: 'Purchases A/c', type: AccountType.COST_OF_GOODS, normalBalance: NormalBalance.DEBIT, isSystem: true },
    { code: 'ACC-CASH', name: 'Cash A/c', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, isSystem: true },
    { code: 'ACC-BANK', name: 'Bank A/c', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, isSystem: true },
    { code: 'ACC-UPI', name: 'UPI A/c', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, isSystem: true },
    { code: 'ACC-RENT', name: 'Rent Expense A/c', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: true },
    { code: 'ACC-ELECTRICITY', name: 'Electricity Expense A/c', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: true },
    { code: 'ACC-SALARY', name: 'Salary Expense A/c', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: true },
    { code: 'ACC-CUSTOMER', name: 'Customer A/c (default)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, isSystem: true },
    { code: 'ACC-SUPPLIER', name: 'Supplier A/c (default)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, isSystem: true },
  ];

  const accounts: Record<string, any> = {};
  for (const item of coaData) {
    const acc = await prisma.account.create({ data: item });
    accounts[item.name] = acc;
  }

  // 5. Setup Account Balances for Years
  console.log('💰 Setting up Account Balances & Opening/Closing ledger accounts...');
  // FY 24-25 Opening Balances
  const balances2425 = [
    { name: 'Cash A/c', opening: 100000, closing: 180000 },
    { name: 'Bank A/c', opening: 1500000, closing: 2450000 },
    { name: 'UPI A/c', opening: 50000, closing: 740000 },
    { name: 'Customer A/c (default)', opening: 200000, closing: 310000 },
    { name: 'Supplier A/c (default)', opening: 350000, closing: 120000 },
  ];

  for (const b of balances2425) {
    await prisma.accountBalance.create({
      data: {
        accountId: accounts[b.name].id,
        financialYearId: fy2425.id,
        openingBalance: b.opening,
        closingBalance: b.closing,
      },
    });
  }

  // FY 25-26 Opening Balances (Must match FY 24-25 Closing Balances)
  const balances2526 = [
    { name: 'Sales A/c', opening: 0, closing: 0 },
    { name: 'Purchases A/c', opening: 0, closing: 0 },
    { name: 'Rent Expense A/c', opening: 0, closing: 0 },
    { name: 'Electricity Expense A/c', opening: 0, closing: 0 },
    { name: 'Salary Expense A/c', opening: 0, closing: 0 },
    { name: 'Cash A/c', opening: 180000, closing: 180000 },
    { name: 'Bank A/c', opening: 2450000, closing: 2450000 },
    { name: 'UPI A/c', opening: 740000, closing: 740000 },
    { name: 'Customer A/c (default)', opening: 310000, closing: 310000 },
    { name: 'Supplier A/c (default)', opening: 120000, closing: 120000 },
  ];

  for (const b of balances2526) {
    await prisma.accountBalance.create({
      data: {
        accountId: accounts[b.name].id,
        financialYearId: fy2526.id,
        openingBalance: b.opening,
        closingBalance: b.closing, // updated dynamically as txns flow
      },
    });
  }

  // 6. Create Premium Customers & Suppliers
  console.log('🛍️ Creating Customers and Suppliers...');
  const customersData = [
    { name: 'Anjali Sharma', type: PartyType.CUSTOMER, phone: '9876543210', email: 'anjali.s@gmail.com' },
    { name: 'Kabir Malhotra', type: PartyType.CUSTOMER, phone: '9812345678', email: 'kabir.m@hotmail.com' },
    { name: 'Priya Patel', type: PartyType.CUSTOMER, phone: '9765432109', email: 'priya.patel@yahoo.com' },
    { name: 'Rohan Mehta', type: PartyType.CUSTOMER, phone: '9988776655', email: 'rohan.m@outlook.com' },
    { name: 'Vikram Singh', type: PartyType.CUSTOMER, phone: '9654321987', email: 'vikram.singh@gmail.com' },
  ];

  const suppliersData = [
    { name: 'Jaipur Looms', type: PartyType.SUPPLIER, phone: '9123456780', email: 'orders@jaipurlooms.com', gstin: '08AAAAA1111A1Z1' },
    { name: 'Banaras Silks', type: PartyType.SUPPLIER, phone: '9234567810', email: 'sales@banarassilks.com', gstin: '09BBBBB2222B2Z2' },
    { name: 'Surat Textile Hub', type: PartyType.SUPPLIER, phone: '9345678120', email: 'info@surattextile.com', gstin: '24CCCCC3333C3Z3' },
    { name: 'Lucknow Chikankari House', type: PartyType.SUPPLIER, phone: '9456781230', email: 'admin@lucknowchikan.com', gstin: '09DDDDD4444D4Z4' },
    { name: 'Kanchipuram Weavers', type: PartyType.SUPPLIER, phone: '9567812340', email: 'weavers@kanchipuram.com', gstin: '33EEEEE5555E5Z5' },
  ];

  const customers: any[] = [];
  for (const c of customersData) {
    customers.push(await prisma.party.create({ data: c }));
  }

  const suppliers: any[] = [];
  for (const s of suppliersData) {
    suppliers.push(await prisma.party.create({ data: s }));
  }

  // 7. Seed 100+ Realistic Transactions (FY 2025-26)
  console.log('📝 Seeding 100+ Transactions across active FY 2025-26...');

  const descriptions = {
    SALE: [
      'Sold Premium Handloom Banarasi Silk Saree',
      'Sold Designer Embroidered Lehenga Choli Set',
      'Sold Cotton Anarkali Suit Set',
      'Sold Jaipur Handblock Print Kurti set',
      'Sold Silk Kanchipuram Bridal Saree',
      'Sold Silk Sherwani and Stole set',
      'Sold Premium Chanderi Suit Material',
    ],
    PURCHASE: [
      'Purchased Silk Saree Stock consignment',
      'Purchased Embroidered Georgette Fabric bulk roll',
      'Purchased Designer Kurti Collection',
      'Purchased Gold Zari Borders and laces',
      'Purchased Premium Hand-loom Dupattas',
    ],
    EXPENSE: [
      'Monthly Showroom Rental Payment',
      'Electricity Showroom Bill payment',
      'Staff Salaries for showroom assistants',
      'Showroom dry cleaning and maintenance expense',
      'Internet and Broadband package subscription',
    ],
    INCOME: [
      'Interest credited to savings bank account',
      'Showroom space sub-lease event space fee',
      'Cash discount received on bulk material',
    ],
    RECEIPT: [
      'Received partial payment for wedding bridal set',
      'Advance deposit for custom designer Lehenga outfit',
      'Settled outstanding customer ledger account balance',
    ],
    PAYMENT: [
      'Settled purchase invoice outstanding dues',
      'Advance deposit payment to weavers workshop',
      'Supplier outstanding balance periodic payment',
    ]
  };

  const getDayInFY = (index: number) => {
    // Distribute transactions throughout April, May, June 2025
    const date = new Date(2025, 3 + Math.floor(index / 35), (index % 28) + 1, 11, 0, 0);
    return date;
  };

  let auditIndex = 1;
  const auditLogsToInsert: any[] = [];

  for (let i = 1; i <= 105; i++) {
    let type: TransactionType = TransactionType.SALE;
    if (i % 6 === 0) type = TransactionType.PURCHASE;
    else if (i % 6 === 1) type = TransactionType.EXPENSE;
    else if (i % 6 === 2) type = TransactionType.INCOME;
    else if (i % 6 === 3) type = TransactionType.RECEIPT;
    else if (i % 6 === 4) type = TransactionType.PAYMENT;

    const pm = (i % 3 === 0) ? PaymentMode.CASH : (i % 3 === 1 ? PaymentMode.BANK : PaymentMode.UPI);
    const amount = (i % 5 === 0) ? 45000 : (i % 5 === 1 ? 125000 : (i % 5 === 2 ? 8500 : (i % 5 === 3 ? 150000 : 3500)));

    const date = getDayInFY(i);
    const descList = descriptions[type];
    const desc = descList[i % descList.length];

    let accountId = accounts['Sales A/c'].id;
    let partyId: string | null = null;
    let debitAccountId = accounts['Cash A/c'].id;
    let creditAccountId = accounts['Sales A/c'].id;

    if (pm === PaymentMode.CASH) {
      debitAccountId = accounts['Cash A/c'].id;
    } else if (pm === PaymentMode.BANK) {
      debitAccountId = accounts['Bank A/c'].id;
    } else {
      debitAccountId = accounts['UPI A/c'].id;
    }

    if (type === TransactionType.SALE) {
      const cust = customers[i % customers.length];
      partyId = cust.id;
      accountId = accounts['Sales A/c'].id;
      creditAccountId = accounts['Sales A/c'].id;
      
      // If Sale on Credit, debit Customer Account instead of Cash/Bank
      if (i % 4 === 0) {
        debitAccountId = accounts['Customer A/c (default)'].id;
      }
    } else if (type === TransactionType.PURCHASE) {
      const supp = suppliers[i % suppliers.length];
      partyId = supp.id;
      accountId = accounts['Purchases A/c'].id;
      debitAccountId = accounts['Purchases A/c'].id;
      
      if (i % 4 === 0) {
        creditAccountId = accounts['Supplier A/c (default)'].id;
      } else {
        creditAccountId = pm === PaymentMode.CASH ? accounts['Cash A/c'].id : (pm === PaymentMode.BANK ? accounts['Bank A/c'].id : accounts['UPI A/c'].id);
      }
    } else if (type === TransactionType.EXPENSE) {
      accountId = (i % 3 === 0) ? accounts['Rent Expense A/c'].id : (i % 3 === 1 ? accounts['Electricity Expense A/c'].id : accounts['Salary Expense A/c'].id);
      debitAccountId = accountId;
      creditAccountId = pm === PaymentMode.CASH ? accounts['Cash A/c'].id : (pm === PaymentMode.BANK ? accounts['Bank A/c'].id : accounts['UPI A/c'].id);
    } else if (type === TransactionType.INCOME) {
      accountId = accounts['Sales A/c'].id; // Simplification
      creditAccountId = accountId;
    } else if (type === TransactionType.RECEIPT) {
      const cust = customers[i % customers.length];
      partyId = cust.id;
      accountId = accounts['Customer A/c (default)'].id;
      creditAccountId = accounts['Customer A/c (default)'].id;
    } else if (type === TransactionType.PAYMENT) {
      const supp = suppliers[i % suppliers.length];
      partyId = supp.id;
      accountId = accounts['Supplier A/c (default)'].id;
      debitAccountId = accounts['Supplier A/c (default)'].id;
      creditAccountId = pm === PaymentMode.CASH ? accounts['Cash A/c'].id : (pm === PaymentMode.BANK ? accounts['Bank A/c'].id : accounts['UPI A/c'].id);
    }

    const refNo = pm !== PaymentMode.CASH ? `REF-${20250000 + i}` : null;

    // Create transaction
    const txn = await prisma.transaction.create({
      data: {
        type,
        date,
        amount,
        paymentMode: pm,
        accountId,
        partyId,
        description: desc,
        referenceNumber: refNo,
        financialYearId: fy2526.id,
        createdById: accountant.id,
        status: TransactionStatus.POSTED,
      },
    });

    // Create balanced Double Entry Journal Entries
    await prisma.journalEntry.create({
      data: {
        transactionId: txn.id,
        accountId: debitAccountId,
        partyId: debitAccountId === accounts['Customer A/c (default)'].id ? partyId : null,
        debit: amount,
        credit: 0,
      },
    });

    await prisma.journalEntry.create({
      data: {
        transactionId: txn.id,
        accountId: creditAccountId,
        partyId: creditAccountId === accounts['Supplier A/c (default)'].id ? partyId : null,
        debit: 0,
        credit: amount,
      },
    });

    // Generate Audit Log
    auditLogsToInsert.push({
      id: generateUlid(auditIndex++),
      eventType: AuditEventType.TRANSACTION_CREATED,
      entityType: 'Transaction',
      entityId: txn.id,
      actorId: accountant.id,
      actorRole: Role.ACCOUNTANT.toString(),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      deviceFingerprint: 'local-seeded-device-fingerprint',
      sessionId: 'local-seeded-session-id',
      before: null,
      after: JSON.parse(JSON.stringify(txn)),
      reason: 'Initial Seeding of Ledger Transactions',
      immutableHash: 'seeded-transaction-sha-hash-mock',
      timestamp: date,
    });
  }

  // 8. Seed Correction Requests
  console.log('🔄 Seeding Correction Requests...');
  const txnsToCorrect = await prisma.transaction.findMany({ take: 3 });

  // 8a. Pending Correction Request
  await prisma.correctionRequest.create({
    data: {
      transactionId: txnsToCorrect[0].id,
      requesterId: employee.id,
      reason: 'Incorrect sale amount entered. The client paid ₹45,000 via UPI, not ₹4,500.',
      proposedChanges: { amount: 45000, description: 'Corrected amount to matches invoice' },
      status: 'PENDING',
    },
  });
  // Update transaction status
  await prisma.transaction.update({
    where: { id: txnsToCorrect[0].id },
    data: { status: TransactionStatus.CORRECTION_REQUESTED },
  });

  // 8b. Approved Correction Request
  const approvedReq = await prisma.correctionRequest.create({
    data: {
      transactionId: txnsToCorrect[1].id,
      requesterId: accountant.id,
      reason: 'Wrong payment mode. Should be Bank instead of Cash.',
      proposedChanges: { paymentMode: PaymentMode.BANK, referenceNumber: 'CHQ-98124' },
      reviewerId: admin.id,
      status: 'APPROVED',
    },
  });
  // Perform actual correction values changes
  await prisma.transaction.update({
    where: { id: txnsToCorrect[1].id },
    data: {
      status: TransactionStatus.CORRECTED,
      paymentMode: PaymentMode.BANK,
      referenceNumber: 'CHQ-98124',
    },
  });

  // 8c. Rejected Correction Request
  await prisma.correctionRequest.create({
    data: {
      transactionId: txnsToCorrect[2].id,
      requesterId: employee.id,
      reason: 'Incorrect date selected. Requesting correction.',
      proposedChanges: { date: new Date('2025-05-15T00:00:00Z') },
      reviewerId: admin.id,
      rejectionReason: 'Date matches the POS physical invoice scan. Rejected correction.',
      status: 'REJECTED',
    },
  });

  // Insert Audit Logs
  console.log('🛡️ Logging seeded events to Audit Trail...');
  for (const log of auditLogsToInsert) {
    await prisma.auditLog.create({ data: log });
  }

  console.log('✨ Showroom database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
