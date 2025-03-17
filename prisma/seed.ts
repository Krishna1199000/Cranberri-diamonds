import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create admin emails
  const adminEmails = [
    'gohilkrishna9004@gmail.com',
    'geetagohil2004@gmail.com',
    'urmilw@cranberridiamonds.in',
    'smithp@cranberridiamonds.in '
  ]

  for (const email of adminEmails) {
    await prisma.adminEmail.upsert({
      where: { email },
      update: {},
      create: { email }
    })
  }

  console.log('Seeded admin emails')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })