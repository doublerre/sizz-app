export interface SaleDraftItem {
  tariffId: string;
  visitorTypeId: string;
  visitorTypeName: string;
  activityId: string;
  activityName: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleDraft {
  visitDate: string;
  items: SaleDraftItem[];
}
