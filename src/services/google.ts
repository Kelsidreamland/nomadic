import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

export const syncGmailFlights = async () => {
  // Mock function since real Gmail API requires a registered OAuth Client ID
  console.log("Mocking Gmail Flight Sync...");
  
  const mockFlights = [
    {
      id: uuidv4(),
      departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      destination: 'Tokyo, Japan',
      airline: 'ANA',
      checkedAllowance: 23,
      carryOnAllowance: 7,
      personalAllowance: 3,
    },
    {
      id: uuidv4(),
      departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      destination: 'Chiang Mai, Thailand',
      airline: 'AirAsia',
      checkedAllowance: 20,
      carryOnAllowance: 7,
      personalAllowance: 0,
    }
  ];

  await db.flights.clear();
  await db.flights.bulkAdd(mockFlights);
  
  return mockFlights;
};

export const getGeoIpLocation = async () => {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data.country_name || 'Unknown';
  } catch (err) {
    console.error('Failed to get Geo IP', err);
    return 'Global';
  }
};
