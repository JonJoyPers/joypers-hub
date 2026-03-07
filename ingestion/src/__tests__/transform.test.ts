import {
  transformEmployee,
  transformLocation,
  transformRoster,
  transformTimesheet,
  transformLeave,
} from '../transform';

describe('transformEmployee', () => {
  test('maps Deputy employee to app schema', () => {
    const dep = {
      Id: 123,
      DisplayName: 'Jordan Blake',
      FirstName: 'Jordan',
      LastName: 'Blake',
      Email: 'jordan@joypers.com',
      Role: 1,
      Company: 5,
      StartDate: 1609459200, // 2021-01-01
      DateOfBirth: 631152000, // 1990-01-01
      Photo: 'https://example.com/photo.jpg',
      Active: true,
    };

    const result = transformEmployee(dep);

    expect(result.deputyId).toBe(123);
    expect(result.name).toBe('Jordan Blake');
    expect(result.firstName).toBe('Jordan');
    expect(result.email).toBe('jordan@joypers.com');
    expect(result.role).toBe('employee');
    expect(result.locationId).toBe(5);
    expect(result.hireDate).toBe('2021-01-01');
    expect(result.isActive).toBe(true);
    expect(result.avatarUrl).toBe('https://example.com/photo.jpg');
  });

  test('maps role levels correctly', () => {
    expect(transformEmployee({ Id: 1, Role: 1, Active: true }).role).toBe('employee');
    expect(transformEmployee({ Id: 2, Role: 2, Active: true }).role).toBe('employee');
    expect(transformEmployee({ Id: 3, Role: 3, Active: true }).role).toBe('manager');
    expect(transformEmployee({ Id: 4, Role: 5, Active: true }).role).toBe('manager');
    expect(transformEmployee({ Id: 5, Role: 7, Active: true }).role).toBe('admin');
    expect(transformEmployee({ Id: 6, Role: 8, Active: true }).role).toBe('admin');
  });

  test('handles missing fields gracefully', () => {
    const result = transformEmployee({ Id: 99, Active: false });
    expect(result.deputyId).toBe(99);
    expect(result.email).toBeNull();
    expect(result.hireDate).toBeNull();
    expect(result.birthday).toBeNull();
    expect(result.avatarUrl).toBeNull();
    expect(result.isActive).toBe(false);
  });

  test('falls back to FirstName + LastName when no DisplayName', () => {
    const result = transformEmployee({
      Id: 1,
      FirstName: 'Jane',
      LastName: 'Doe',
      Active: true,
    });
    expect(result.name).toBe('Jane Doe');
  });
});

describe('transformLocation', () => {
  test('maps Deputy location to app schema', () => {
    const dep = {
      Id: 5,
      CompanyName: 'Joy-Per\'s Main Store',
      Street: '123 Main St',
      City: 'Dallas',
      State: 'TX',
      Postcode: '75001',
      Country: 'US',
      Timezone: 'America/Chicago',
      Active: true,
    };

    const result = transformLocation(dep);
    expect(result.deputyId).toBe(5);
    expect(result.name).toBe("Joy-Per's Main Store");
    expect(result.address).toBe('123 Main St, Dallas, TX, 75001, US');
    expect(result.timezone).toBe('America/Chicago');
    expect(result.isActive).toBe(true);
  });

  test('handles missing address fields', () => {
    const result = transformLocation({ Id: 1, CompanyName: 'Store', Active: true });
    expect(result.address).toBeNull();
  });
});

describe('transformRoster', () => {
  test('maps roster to shift with inferred type', () => {
    const dep = {
      Id: 100,
      Employee: 123,
      OperationalUnit: 5,
      StartTime: 1609495200, // 2021-01-01 10:00 UTC
      EndTime: 1609524000,   // 2021-01-01 18:00 UTC (8 hours)
      Published: true,
      Creator: 1,
    };

    const result = transformRoster(dep);
    expect(result.deputyId).toBe(100);
    expect(result.employeeDeputyId).toBe(123);
    expect(result.locationDeputyId).toBe(5);
    expect(result.published).toBe(true);
    expect(result.type).not.toBeNull();
  });

  test('infers inventory shift type from comment', () => {
    const dep = {
      Id: 200,
      Employee: 123,
      OperationalUnit: 5,
      StartTime: 1609495200,
      EndTime: 1609524000,
      Comment: 'Annual Inventory Count',
      Published: true,
      Creator: 1,
    };

    const result = transformRoster(dep);
    expect(result.type).toBe('inventory');
  });

  test('infers part_time for short shifts', () => {
    const dep = {
      Id: 300,
      Employee: 123,
      OperationalUnit: 5,
      StartTime: 1609495200,         // 10:00 UTC
      EndTime: 1609495200 + 3 * 3600, // 3 hours
      Published: true,
      Creator: 1,
    };

    const result = transformRoster(dep);
    expect(result.type).toBe('part_time');
  });
});

describe('transformTimesheet', () => {
  test('creates clock_in and clock_out punches', () => {
    const dep = {
      Id: 500,
      Employee: 123,
      StartTime: 1609495200,
      EndTime: 1609524000,
    };

    const punches = transformTimesheet(dep);
    expect(punches.length).toBe(2);
    expect(punches[0].type).toBe('clock_in');
    expect(punches[1].type).toBe('clock_out');
    expect(punches[0].employeeDeputyId).toBe(123);
  });

  test('includes break punches', () => {
    const dep = {
      Id: 600,
      Employee: 123,
      StartTime: 1609495200,
      EndTime: 1609524000,
      Breaks: [
        { Start: 1609509600, End: 1609511400 },
      ],
    };

    const punches = transformTimesheet(dep);
    expect(punches.length).toBe(4); // clock_in, break_start, break_end, clock_out
    const types = punches.map((p: any) => p.type);
    expect(types).toContain('break_start');
    expect(types).toContain('break_end');
  });

  test('skips clock_out when EndTime is 0', () => {
    const dep = {
      Id: 700,
      Employee: 123,
      StartTime: 1609495200,
      EndTime: 0,
    };

    const punches = transformTimesheet(dep);
    expect(punches.length).toBe(1);
    expect(punches[0].type).toBe('clock_in');
  });
});

describe('transformLeave', () => {
  test('maps Deputy leave to app schema', () => {
    const dep = {
      Id: 800,
      Employee: 123,
      LeaveRule: 10,
      LeaveRuleName: 'Annual Leave',
      Start: 1609459200,
      End: 1609718400,
      Hours: 24,
      Status: 1,
      ApproveComment: 'Enjoy your vacation',
      ApprovedBy: 1,
      DateApproved: 1609372800,
    };

    const result = transformLeave(dep);
    expect(result.deputyId).toBe(800);
    expect(result.employeeDeputyId).toBe(123);
    expect(result.leaveRuleName).toBe('Annual Leave');
    expect(result.hours).toBe('24');
    expect(result.status).toBe('approved');
    expect(result.reason).toBe('Enjoy your vacation');
  });

  test('maps leave statuses correctly', () => {
    const make = (status: number) => transformLeave({ Id: 1, Employee: 1, Start: 1609459200, End: 1609459200, Status: status });

    expect(make(0).status).toBe('pending');
    expect(make(1).status).toBe('approved');
    expect(make(2).status).toBe('declined');
    expect(make(3).status).toBe('cancelled');
  });

  test('handles unknown status as pending', () => {
    const result = transformLeave({ Id: 1, Employee: 1, Start: 1609459200, End: 1609459200, Status: 99 });
    expect(result.status).toBe('pending');
  });
});
