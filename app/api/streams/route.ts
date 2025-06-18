```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, AccountInfo } from '@solana/web3.js'
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor'

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
const STREAMFLOW_PROGRAM_ID = new PublicKey('strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m')

interface StreamData {
  id: string
  sender: string
  recipient: string
  mint: string
  depositedAmount: string
  withdrawnAmount: string
  startTime: number
  endTime: number
  cliffTime: number
  cancelableBySender: boolean
  cancelableByRecipient: boolean
  transferableBySender: boolean
  transferableByRecipient: boolean
  automaticWithdrawal: boolean
  withdrawalFrequency: number
  name: string
  status: 'active' | 'paused' | 'cancelled' | 'completed'
  createdAt: number
  lastWithdrawnAt: number
  availableAmount: string
  streamedAmount: string
  remainingAmount: string
}

interface StreamFilters {
  sender?: string
  recipient?: string
  status?: string
  mint?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'endTime' | 'amount'
  sortOrder?: 'asc' | 'desc'
}

const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

async function fetchStreamAccounts(filters: StreamFilters = {}): Promise<StreamData[]> {
  try {
    const programAccounts = await connection.getProgramAccounts(STREAMFLOW_PROGRAM_ID, {
      filters: [
        {
          dataSize: 1000,
        },
      ],
    })

    const streams: StreamData[] = []

    for (const account of programAccounts) {
      try {
        const streamData = parseStreamAccount(account.account, account.pubkey.toString())
        
        if (filters.sender && streamData.sender !== filters.sender) continue
        if (filters.recipient && streamData.recipient !== filters.recipient) continue
        if (filters.status && streamData.status !== filters.status) continue
        if (filters.mint && streamData.mint !== filters.mint) continue

        streams.push(streamData)
      } catch (error) {
        console.error('Error parsing stream account:', error)
        continue
      }
    }

    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'desc'

    streams.sort((a, b) => {
      let aValue: number
      let bValue: number

      switch (sortBy) {
        case 'endTime':
          aValue = a.endTime
          bValue = b.endTime
          break
        case 'amount':
          aValue = parseFloat(a.depositedAmount)
          bValue = parseFloat(b.depositedAmount)
          break
        default:
          aValue = a.createdAt
          bValue = b.createdAt
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    const page = filters.page || 1
    const limit = filters.limit || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    return streams.slice(startIndex, endIndex)
  } catch (error) {
    console.error('Error fetching stream accounts:', error)
    throw new Error('Failed to fetch streams')
  }
}

function parseStreamAccount(account: AccountInfo<Buffer>, publicKey: string): StreamData {
  const data = account.data
  
  const sender = new PublicKey(data.slice(8, 40)).toString()
  const recipient = new PublicKey(data.slice(40, 72)).toString()
  const mint = new PublicKey(data.slice(72, 104)).toString()
  
  const depositedAmount = new BN(data.slice(104, 112), 'le').toString()
  const withdrawnAmount = new BN(data.slice(112, 120), 'le').toString()
  const startTime = new BN(data.slice(120, 128), 'le').toNumber()
  const endTime = new BN(data.slice(128, 136), 'le').toNumber()
  const cliffTime = new BN(data.slice(136, 144), 'le').toNumber()
  
  const flags = data[144]
  const cancelableBySender = !!(flags & 1)
  const cancelableByRecipient = !!(flags & 2)
  const transferableBySender = !!(flags & 4)
  const transferableByRecipient = !!(flags & 8)
  const automaticWithdrawal = !!(flags & 16)
  
  const withdrawalFrequency = new BN(data.slice(145, 153), 'le').toNumber()
  const lastWithdrawnAt = new BN(data.slice(153, 161), 'le').toNumber()
  const createdAt = new BN(data.slice(161, 169), 'le').toNumber()
  
  const nameLength = data[169]
  const name = data.slice(170, 170 + nameLength).toString('utf8')
  
  const currentTime = Math.floor(Date.now() / 1000)
  let status: 'active' | 'paused' | 'cancelled' | 'completed' = 'active'
  
  if (currentTime >= endTime) {
    status = 'completed'
  } else if (currentTime < startTime) {
    status = 'paused'
  }
  
  const totalDuration = endTime - startTime
  const elapsedTime = Math.max(0, currentTime - startTime)
  const streamedAmount = totalDuration > 0 
    ? new BN(depositedAmount).mul(new BN(Math.min(elapsedTime, totalDuration))).div(new BN(totalDuration)).toString()
    : '0'
  
  const availableAmount = new BN(streamedAmount).sub(new BN(withdrawnAmount)).toString()
  const remainingAmount = new BN(depositedAmount).sub(new BN(withdrawnAmount)).toString()

  return {
    id: publicKey,
    sender,
    recipient,
    mint,
    depositedAmount,
    withdrawnAmount,
    startTime,
    endTime,
    cliffTime,
    cancelableBySender,
    cancelableByRecipient,
    transferableBySender,
    transferableByRecipient,
    automaticWithdrawal,
    withdrawalFrequency,
    name,
    status,
    createdAt,
    lastWithdrawnAt,
    availableAmount,
    streamedAmount,
    remainingAmount,
  }
}

async function getStreamById(streamId: string): Promise<StreamData | null> {
  try {
    const publicKey = new PublicKey(streamId)
    const account = await connection.getAccountInfo(publicKey)
    
    if (!account || account.owner.toString() !== STREAMFLOW_PROGRAM_ID.toString()) {
      return null
    }
    
    return parseStreamAccount(account, streamId)
  } catch (error) {
    console.error('Error fetching stream by ID:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const streamId = searchParams.get('id')
    if (streamId) {
      const stream = await getStreamById(streamId)
      if (!stream) {
        return NextResponse.json(
          { error: 'Stream not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ stream })
    }

    const filters: StreamFilters = {
      sender: searchParams.get('sender') || undefined,
      recipient: searchParams.get('recipient') || undefined,
      status: searchParams.get('status') || undefined,
      mint: searchParams.get('mint') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      sortBy: (searchParams.get('sortBy') as 'createdAt' | 'endTime' | 'amount') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
    }

    const streams = await fetchStreamAccounts(filters)
    
    const totalCount = await getTotalStreamCount(filters)
    const page = filters.page || 1
    const limit = filters.limit || 20
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      streams,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/streams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getTotalStreamCount(filters: StreamFilters): Promise<number> {
  try {
    const programAccounts = await connection.getProgramAccounts(STREAMFLOW_PROGRAM_ID, {
      filters: [
        {
          dataSize: 1000,
        },
      ],
      dataSlice: {
        offset: 0,
        length: 0,
      },
    })

    if (!filters.sender && !filters.recipient && !filters.status && !filters.mint) {
      return programAccounts.length
    }

    let count = 0
    for (const account of programAccounts) {
      try {
        const streamData = parseStreamAccount(account.account, account.pubkey.toString())
        
        if (filters.sender && streamData.sender !== filters.sender) continue
        if (filters.recipient && streamData.recipient !== filters.recipient) continue
        if (filters.status && streamData.status !== filters.status) continue
        if (filters.mint && streamData.mint !== filters.mint) continue

        count++
      } catch (error) {
        continue
      }
    }

    return count
  } catch (error) {
    console.error('Error getting total stream count:', error)
    return 0
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      sender,
      recipient,
      mint,
      amount,
      startTime,
      endTime,
      cliffTime,
      name,
      cancelableBySender = true,
      cancelableByRecipient = false,
      transferableBySender = false,
      transferableByRecipient = false,
      automaticWithdrawal = false,
      withdrawalFrequency = 0,
    } = body

    if (!sender || !recipient || !mint || !amount || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      )
    }

    if (cliffTime && (cliffTime < startTime || cliffTime > endTime)) {
      return NextResponse.json(
        { error: 'Cliff time must be between start and end time' },
        { status: 400 }
      )
    }

    try {
      new PublicKey(sender)
      new PublicKey(recipient)
      new PublicKey(mint)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid public key format' },
        { status: 400 }
      )
    }

    const streamData = {
      sender,
      recipient,
      mint,
      amount: amount.toString(),
      startTime: Math.floor(startTime),
      endTime: Math.floor(endTime),
      cliffTime: cliffTime ? Math.floor(cliffTime) : Math.floor(startTime),
      name: name || '',
      cancelableBySender,
      cancelableByRecipient,
      transferableBySender,
      transferableByRecipient,
      automaticWithdrawal,
      withdrawalFrequency: withdrawalFrequency || 0,
      createdAt: Math.floor(Date.now() / 1000),
    }

    return NextResponse.json({
      message: 'Stream creation data validated',
      streamData,
    })
  } catch (error) {
    console.error('Error in POST /api/streams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { streamId, action, amount } = body

    if (!streamId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const stream = await getStreamById(streamId)
    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    const validActions = ['withdraw', 'cancel', 'pause', 'resume', 'transfer']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    if (action === 'withdraw' && !amount) {
      return NextResponse.json(
        { error: 'Amount required for withdrawal' },
        { status: 400 }
      )
    }

    if (action === 'withdraw') {
      const availableAmount = new BN(stream.availableAmount)
      const withdrawAmount = new BN(amount.toString())

      if (withdrawAmount.gt(availableAmount)) {
        return NextResponse.json(
          { error: 'Insufficient available amount' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      message: `Stream ${action} validated`,
      streamId,
      action,
      amount: amount || null,
    })
  } catch (error) {
    console.error('Error in PUT /api/streams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const streamId = searchParams.get('id')

    if (!streamId) {
      return NextResponse.json(
        { error: 'Stream ID required' },
        { status: 400 }
      )
    }

    const stream = await getStreamById(streamId)
    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    if (stream.status === 'cancelled') {
      return NextResponse.json(