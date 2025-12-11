export type ParentProfile = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  homeAddress?: string;
  defaultCurrency: string;
  timeZone: string;
  legalNotes?: string;
};

export type Child = {
  id: string;
  parentId: string;
  fullName: string;
  birthDate?: string; // ISO date string
  primarySchool?: string;
  notes?: string;
};

export type VisitType = 'physical_care' | 'overnight' | 'virtual_call' | 'school_transport_only';
export type VisitSource = 'manual_start_stop' | 'auto_from_trip' | 'imported_from_calendar' | 'auto_detected';

export type VisitSession = {
  id: string;
  childId: string;
  startTime: string; // ISO datetime
  endTime?: string; // ISO datetime
  type: VisitType;
  source: VisitSource;
  locationTag?: string;
  notes?: string;
};

export type TripPurpose = 'pickup' | 'dropoff' | 'visit_activity' | 'medical' | 'activity' | 'other_child_related';

export type LocationPoint = {
  lat: number;
  lng: number;
  label?: string;
};

export type Trip = {
  id: string;
  childId: string;
  purpose: TripPurpose;
  startTime: string; // ISO datetime
  endTime?: string; // ISO datetime
  startLocation?: LocationPoint;
  endLocation?: LocationPoint;
  path?: LocationPoint[]; // Array of GPS points
  distanceMiles?: number;
  mileageRatePerMile?: number;
  reimbursableAmount?: number;
  autoDetected: boolean;
  notes?: string;
};

export type ExpenseCategory = 'school' | 'medical' | 'clothing' | 'activities' | 'entertainment' | 'food' | 'transport' | 'other';
export type ReimbursementStatus = 'not_requested' | 'requested' | 'partial' | 'paid';

export type Expense = {
  id: string;
  childId?: string;
  parentId: string;
  date: string; // ISO date
  amount: number;
  category: ExpenseCategory;
  merchantName?: string;
  paymentMethod?: string;
  receiptImageId?: string;
  reimbursementStatus: ReimbursementStatus;
  notes?: string;
};

export type EvidenceType = 'screenshot' | 'photo' | 'pdf' | 'note' | 'audio_file' | 'chat_export';

export type EvidenceItem = {
  id: string;
  childId?: string;
  type: EvidenceType;
  sourceApp?: string;
  createdAt: string; // ISO datetime
  importedAt: string; // ISO datetime
  fileId?: string; // Path or ID to stored file
  textPreview?: string;
  relatedVisitId?: string;
  relatedTripId?: string;
  tags?: string[];
  notes?: string;
};

export type ChannelType = 'sms_share_extension' | 'whatsapp_share_extension' | 'email_forward' | 'manual_note';
export type MessageDirection = 'incoming' | 'outgoing' | 'mixed';

export type ConversationLog = {
  id: string;
  counterpartyName: string;
  channel: ChannelType;
  startTime: string; // ISO datetime
  endTime?: string; // ISO datetime
  messageCount?: number;
  direction?: MessageDirection;
  summaryText?: string;
  evidenceItemIds?: string[];
};

export type ReportType = 'time_share' | 'mileage' | 'expenses' | 'all_evidence';
export type ReportFrequency = 'manual' | 'monthly' | 'weekly';
export type DeliveryMethod = 'on_device_pdf' | 'icloud_drive' | 'email_export_prompt';

export type ReportConfig = {
  id: string;
  parentId: string;
  reportType: ReportType;
  frequency: ReportFrequency;
  deliveryMethod: DeliveryMethod;
  includeRawExports: boolean;
};
