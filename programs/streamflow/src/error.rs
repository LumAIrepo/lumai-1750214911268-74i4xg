```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum StreamFlowError {
    #[msg("Stream has not started yet")]
    StreamNotStarted,
    
    #[msg("Stream has already ended")]
    StreamEnded,
    
    #[msg("Stream is already paused")]
    StreamAlreadyPaused,
    
    #[msg("Stream is not paused")]
    StreamNotPaused,
    
    #[msg("Stream is already cancelled")]
    StreamAlreadyCancelled,
    
    #[msg("Insufficient withdrawable amount")]
    InsufficientWithdrawableAmount,
    
    #[msg("Invalid recipient")]
    InvalidRecipient,
    
    #[msg("Invalid sender")]
    InvalidSender,
    
    #[msg("Invalid stream duration")]
    InvalidStreamDuration,
    
    #[msg("Invalid stream amount")]
    InvalidStreamAmount,
    
    #[msg("Invalid cliff duration")]
    InvalidCliffDuration,
    
    #[msg("Stream amount must be greater than zero")]
    ZeroStreamAmount,
    
    #[msg("Stream duration must be greater than zero")]
    ZeroStreamDuration,
    
    #[msg("Cliff duration cannot exceed stream duration")]
    CliffExceedsStreamDuration,
    
    #[msg("Unauthorized operation")]
    Unauthorized,
    
    #[msg("Stream is not active")]
    StreamNotActive,
    
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    
    #[msg("Insufficient token balance")]
    InsufficientTokenBalance,
    
    #[msg("Token account owner mismatch")]
    TokenAccountOwnerMismatch,
    
    #[msg("Invalid escrow account")]
    InvalidEscrowAccount,
    
    #[msg("Escrow account already initialized")]
    EscrowAlreadyInitialized,
    
    #[msg("Mathematical overflow")]
    MathematicalOverflow,
    
    #[msg("Mathematical underflow")]
    MathematicalUnderflow,
    
    #[msg("Division by zero")]
    DivisionByZero,
    
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
    
    #[msg("Start time must be in the future")]
    StartTimeInPast,
    
    #[msg("End time must be after start time")]
    EndTimeBeforeStartTime,
    
    #[msg("Cliff time must be after start time")]
    CliffTimeBeforeStartTime,
    
    #[msg("Cannot withdraw before cliff period")]
    WithdrawBeforeCliff,
    
    #[msg("Stream has already been fully withdrawn")]
    StreamFullyWithdrawn,
    
    #[msg("Invalid withdrawal amount")]
    InvalidWithdrawalAmount,
    
    #[msg("Cannot cancel stream after it has started")]
    CannotCancelAfterStart,
    
    #[msg("Only sender can cancel stream")]
    OnlySenderCanCancel,
    
    #[msg("Only recipient can withdraw")]
    OnlyRecipientCanWithdraw,
    
    #[msg("Only sender can pause stream")]
    OnlySenderCanPause,
    
    #[msg("Only sender can resume stream")]
    OnlySenderCanResume,
    
    #[msg("Stream rate calculation error")]
    StreamRateCalculationError,
    
    #[msg("Invalid stream type")]
    InvalidStreamType,
    
    #[msg("Stream configuration mismatch")]
    StreamConfigurationMismatch,
    
    #[msg("Account discriminator mismatch")]
    AccountDiscriminatorMismatch,
    
    #[msg("Account not initialized")]
    AccountNotInitialized,
    
    #[msg("Account already closed")]
    AccountAlreadyClosed,
    
    #[msg("Invalid program authority")]
    InvalidProgramAuthority,
    
    #[msg("Program authority mismatch")]
    ProgramAuthorityMismatch,
    
    #[msg("Invalid fee percentage")]
    InvalidFeePercentage,
    
    #[msg("Fee calculation error")]
    FeeCalculationError,
    
    #[msg("Insufficient fee payment")]
    InsufficientFeePayment,
    
    #[msg("Invalid fee recipient")]
    InvalidFeeRecipient,
    
    #[msg("Stream metadata too large")]
    StreamMetadataTooLarge,
    
    #[msg("Invalid stream name")]
    InvalidStreamName,
    
    #[msg("Stream name too long")]
    StreamNameTooLong,
    
    #[msg("Duplicate stream name")]
    DuplicateStreamName,
    
    #[msg("Invalid cancellation policy")]
    InvalidCancellationPolicy,
    
    #[msg("Cancellation not allowed")]
    CancellationNotAllowed,
    
    #[msg("Invalid transferability setting")]
    InvalidTransferability,
    
    #[msg("Stream is not transferable")]
    StreamNotTransferable,
    
    #[msg("Invalid new recipient")]
    InvalidNewRecipient,
    
    #[msg("Cannot transfer to same recipient")]
    CannotTransferToSameRecipient,
    
    #[msg("Transfer cooldown period active")]
    TransferCooldownActive,
    
    #[msg("Maximum number of streams exceeded")]
    MaxStreamsExceeded,
    
    #[msg("Stream template not found")]
    StreamTemplateNotFound,
    
    #[msg("Invalid stream template")]
    InvalidStreamTemplate,
    
    #[msg("Template parameter mismatch")]
    TemplateParameterMismatch,
    
    #[msg("Batch operation limit exceeded")]
    BatchOperationLimitExceeded,
    
    #[msg("Invalid batch operation")]
    InvalidBatchOperation,
    
    #[msg("Partial batch operation failure")]
    PartialBatchOperationFailure,
    
    #[msg("Stream schedule conflict")]
    StreamScheduleConflict,
    
    #[msg("Invalid vesting schedule")]
    InvalidVestingSchedule,
    
    #[msg("Vesting schedule not found")]
    VestingScheduleNotFound,
    
    #[msg("Cannot modify active vesting schedule")]
    CannotModifyActiveVestingSchedule,
    
    #[msg("Invalid unlock percentage")]
    InvalidUnlockPercentage,
    
    #[msg("Unlock percentage exceeds maximum")]
    UnlockPercentageExceedsMaximum,
    
    #[msg("Invalid linear release parameters")]
    InvalidLinearReleaseParameters,
    
    #[msg("Invalid milestone parameters")]
    InvalidMilestoneParameters,
    
    #[msg("Milestone not reached")]
    MilestoneNotReached,
    
    #[msg("Invalid milestone proof")]
    InvalidMilestoneProof,
    
    #[msg("Milestone already claimed")]
    MilestoneAlreadyClaimed,
    
    #[msg("Oracle price feed error")]
    OraclePriceFeedError,
    
    #[msg("Price feed stale")]
    PriceFeedStale,
    
    #[msg("Price feed unavailable")]
    PriceFeedUnavailable,
    
    #[msg("Invalid price threshold")]
    InvalidPriceThreshold,
    
    #[msg("Price condition not met")]
    PriceConditionNotMet,
    
    #[msg("Invalid governance proposal")]
    InvalidGovernanceProposal,
    
    #[msg("Governance proposal not passed")]
    GovernanceProposalNotPassed,
    
    #[msg("Governance voting period active")]
    GovernanceVotingPeriodActive,
    
    #[msg("Invalid voting power")]
    InvalidVotingPower,
    
    #[msg("Already voted")]
    AlreadyVoted,
    
    #[msg("Voting period expired")]
    VotingPeriodExpired,
    
    #[msg("Quorum not reached")]
    QuorumNotReached,
    
    #[msg("Emergency pause active")]
    EmergencyPauseActive,
    
    #[msg("Emergency pause not active")]
    EmergencyPauseNotActive,
    
    #[msg("Invalid emergency pause authority")]
    InvalidEmergencyPauseAuthority,
    
    #[msg("Upgrade authority required")]
    UpgradeAuthorityRequired,
    
    #[msg("Invalid upgrade authority")]
    InvalidUpgradeAuthority,
    
    #[msg("Program upgrade in progress")]
    ProgramUpgradeInProgress,
    
    #[msg("Deprecated instruction")]
    DeprecatedInstruction,
    
    #[msg("Feature not enabled")]
    FeatureNotEnabled,
    
    #[msg("Maintenance mode active")]
    MaintenanceModeActive,
    
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[msg("Invalid signature")]
    InvalidSignature,
    
    #[msg("Signature verification failed")]
    SignatureVerificationFailed,
    
    #[msg("Nonce already used")]
    NonceAlreadyUsed,
    
    #[msg("Invalid nonce")]
    InvalidNonce,
    
    #[msg("Replay attack detected")]
    ReplayAttackDetected,
    
    #[msg("Invalid multisig threshold")]
    InvalidMultisigThreshold,
    
    #[msg("Insufficient multisig signatures")]
    InsufficientMultisigSignatures,
    
    #[msg("Multisig signer not found")]
    MultisigSignerNotFound,
    
    #[msg("Duplicate multisig signer")]
    DuplicateMultisigSigner,
    
    #[msg("Invalid timelock delay")]
    InvalidTimelockDelay,
    
    #[msg("Timelock not expired")]
    TimelockNotExpired,
    
    #[msg("Timelock already executed")]
    TimelockAlreadyExecuted,
    
    #[msg("Invalid timelock proposal")]
    InvalidTimelockProposal,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageToleranceExceeded,
    
    #[msg("Invalid slippage tolerance")]
    InvalidSlippageTolerance,
    
    #[msg("Deadline exceeded")]
    DeadlineExceeded,
    
    #[msg("Invalid deadline")]
    InvalidDeadline,
    
    #[msg("Liquidity insufficient")]
    LiquidityInsufficient,
    
    #[msg("Invalid liquidity amount")]
    InvalidLiquidityAmount,
    
    #[msg("Pool not found")]
    PoolNotFound,
    
    #[msg("Invalid pool configuration")]
    InvalidPoolConfiguration,
    
    #[msg("Pool already exists")]
    PoolAlreadyExists,
    
    #[msg("Pool not active")]
    PoolNotActive,
    
    #[msg("Invalid swap parameters")]
    InvalidSwapParameters,
    
    #[msg("Swap amount too small")]
    SwapAmountTooSmall,
    
    #[msg("Swap amount too large")]
    SwapAmountTooLarge,
    
    #[msg("Invalid token pair")]
    InvalidTokenPair,
    
    #[msg("Identical token addresses")]
    IdenticalTokenAddresses,
    
    #[msg("Unsupported token")]
    UnsupportedToken,
    
    #[msg("Token not whitelisted")]
    TokenNotWhitelisted,
    
    #[msg("Blacklisted token")]
    BlacklistedToken,
    
    #[msg("Invalid token decimals")]
    InvalidTokenDecimals,
    
    #[msg("Token supply exceeded")]
    TokenSupplyExceeded,
    
    #[msg("Mint authority required")]
    MintAuthorityRequired,
    
    #[msg("Freeze authority required")]
    FreezeAuthorityRequired,
    
    #[msg("Account frozen")]
    AccountFrozen,
    
    #[msg("Invalid account state")]
    InvalidAccountState,
    
    #[msg("Account state transition invalid")]
    AccountStateTransitionInvalid,
    
    #[msg("Concurrent modification detected")]
    ConcurrentModificationDetected,
    
    #[msg("Version mismatch")]
    VersionMismatch,
    
    #[msg("Incompatible version")]
    IncompatibleVersion,
    
    #[msg("Migration required")]
    MigrationRequired,
    
    #[msg("Migration in progress")]
    MigrationInProgress,
    
    #[msg("Migration failed")]
    MigrationFailed,
    
    #[msg("Backup required")]
    BackupRequired,
    
    #[msg("Backup failed")]
    BackupFailed,
    
    #[msg("Restore failed")]
    RestoreFailed,
    
    #[msg("Data corruption detected")]
    DataCorruptionDetected,
    
    #[msg("Checksum mismatch")]
    ChecksumMismatch,
    
    #[msg("Invalid data format")]
    InvalidDataFormat,
    
    #[msg("Data size limit exceeded")]
    DataSizeLimitExceeded,
    
    #[msg("Storage quota exceeded")]
    StorageQuotaExceeded,
    
    #[msg("Network congestion")]
    NetworkCongestion,
    
    #[msg("Transaction timeout")]
    TransactionTimeout,
    
    #[msg("Connection lost")]
    ConnectionLost,
    
    #[msg("Service unavailable")]
    ServiceUnavailable,
    
    #[msg("Resource exhausted")]
    ResourceExhausted,
    
    #[msg("Memory allocation failed")]
    MemoryAllocationFailed,
    
    #[msg("Stack overflow")]
    StackOverflow,
    
    #[msg("Heap overflow")]
    HeapOverflow,
    
    #[msg("Buffer overflow")]
    BufferOverflow,
    
    #[msg("Buffer underflow")]
    BufferUnderflow,
    
    #[msg("Invalid buffer size")]
    InvalidBufferSize,
    
    #[msg("Serialization failed")]
    SerializationFailed,
    
    #[msg("Deserialization failed")]
    DeserializationFailed,
    
    #[msg("Encoding error")]
    EncodingError,
    
    #[msg("Decoding error")]
    DecodingError,
    
    #[msg("Compression failed")]
    CompressionFailed,
    
    #[msg("Decompression failed")]
    DecompressionFailed,
    
    #[msg("Hash mismatch")]
    HashMismatch,
    
    #[msg("Invalid hash algorithm")]
    InvalidHashAlgorithm,
    
    #[msg("Encryption failed")]
    EncryptionFailed,
    
    #[msg("Decryption failed")]
    DecryptionFailed,
    
    #[msg("Invalid encryption key")]
    InvalidEncryptionKey,
    
    #[msg("Key derivation failed")]
    KeyDerivationFailed,
    
    #[msg("Invalid key length")]
    InvalidKeyLength,
    
    #[msg("Key rotation required")]
    KeyRotationRequired,
    
    #[msg("Certificate expired")]
    CertificateExpired,
    
    #[msg("Certificate invalid")]
    CertificateInvalid,
    
    #[msg("Certificate revoked")]
    CertificateRevoked,
    
    #[msg("Trust chain broken")]
    TrustChainBroken,
    
    #[msg("Authentication failed")]
    AuthenticationFailed,
    
    #[msg("Authorization