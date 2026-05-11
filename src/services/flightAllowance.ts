import type { Flight } from '../db';

export type AllowanceField = 'checkedAllowance' | 'carryOnAllowance' | 'personalAllowance';

export const getPassengerCount = (flight?: Pick<Flight, 'passengerCount'> | null) => {
  const count = Number(flight?.passengerCount ?? 1);
  if (!Number.isFinite(count)) return 1;
  return Math.min(9, Math.max(1, Math.round(count)));
};

export const getCombinedAllowance = (
  flight: Pick<Flight, AllowanceField | 'passengerCount'>,
  field: AllowanceField,
) => {
  const allowance = Number(flight[field] ?? 0);
  return (Number.isFinite(allowance) ? allowance : 0) * getPassengerCount(flight);
};
