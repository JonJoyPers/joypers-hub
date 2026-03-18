// Deputy → Supabase field mapping utilities

export function transformEmployee(dep: any) {
  return {
    deputyId: dep.Id,
    name: dep.DisplayName || `${dep.FirstName} ${dep.LastName}`.trim(),
    firstName: dep.FirstName,
    email: dep.Email || null,
    role: mapRole(dep.Role),
    department: null, // Deputy doesn't have a direct department field
    title: null,
    locationId: dep.Company || null,
    hireDate: dep.StartDate ? epochToDate(dep.StartDate) : null,
    birthday: dep.DateOfBirth ? epochToDate(dep.DateOfBirth) : null,
    avatarUrl: dep.Photo ? String(dep.Photo) : null,
    isActive: Boolean(dep.Active),
  };
}

export function transformLocation(dep: any) {
  return {
    deputyId: dep.Id,
    name: dep.CompanyName || dep.Company,
    address: formatAddress(dep),
    timezone: dep.Timezone || 'America/Chicago',
    isActive: Boolean(dep.Active),
  };
}

export function transformRoster(dep: any) {
  return {
    deputyId: dep.Id,
    employeeDeputyId: dep.Employee,
    locationDeputyId: dep.OperationalUnit,
    date: epochToDate(dep.StartTime),
    startTime: epochToTimestamp(dep.StartTime),
    endTime: epochToTimestamp(dep.EndTime),
    type: inferShiftType(dep),
    published: Boolean(dep.Published),
    creatorDeputyId: dep.Creator,
  };
}

export function transformTimesheet(dep: any) {
  const punches: any[] = [];

  // Synthetic punch IDs use dep.Id * 10_000 + offset to avoid collisions.
  // Offsets: 1 = clock_in, 2 = clock_out, 100+ = breaks (even = start, odd = end).
  // This supports up to ~4950 breaks per timesheet with no overlap between timesheets.
  const base = dep.Id * 10_000;

  // Clock in
  if (dep.StartTime) {
    punches.push({
      deputyId: base + 1,
      employeeDeputyId: dep.Employee,
      type: 'clock_in' as const,
      timestamp: epochToTimestamp(dep.StartTime),
    });
  }

  // Breaks
  if (dep.Breaks && Array.isArray(dep.Breaks)) {
    dep.Breaks.forEach((b: any, i: number) => {
      if (b.Start) {
        punches.push({
          deputyId: base + 100 + i * 2,
          employeeDeputyId: dep.Employee,
          type: 'break_start' as const,
          timestamp: epochToTimestamp(b.Start),
        });
      }
      if (b.End) {
        punches.push({
          deputyId: base + 100 + i * 2 + 1,
          employeeDeputyId: dep.Employee,
          type: 'break_end' as const,
          timestamp: epochToTimestamp(b.End),
        });
      }
    });
  }

  // Clock out
  if (dep.EndTime && dep.EndTime > 0) {
    punches.push({
      deputyId: base + 2,
      employeeDeputyId: dep.Employee,
      type: 'clock_out' as const,
      timestamp: epochToTimestamp(dep.EndTime),
    });
  }

  return punches;
}

export function transformLeave(dep: any) {
  return {
    deputyId: dep.Id,
    employeeDeputyId: dep.Employee,
    leaveRuleDeputyId: dep.LeaveRule,
    leaveRuleName: dep.LeaveRuleName || dep._LeaveRuleName || null,
    startDate: epochToDate(dep.Start),
    endDate: epochToDate(dep.End),
    hours: dep.Hours ? String(dep.Hours) : null,
    status: mapLeaveStatus(dep.Status),
    reason: dep.ApproveComment || null,
    approvedByDeputyId: dep.ApprovedBy || null,
    reviewedAt: dep.DateApproved ? epochToTimestamp(dep.DateApproved) : null,
  };
}

// --- Helpers ---

function mapRole(deputyRole: number): 'admin' | 'manager' | 'employee' {
  // Deputy role levels: 1=Employee, 3=Supervisor, 7=SystemAdmin, 8=Admin
  if (deputyRole >= 7) return 'admin';
  if (deputyRole >= 3) return 'manager';
  return 'employee';
}

function inferShiftType(dep: any): 'opening' | 'mid' | 'closing' | 'inventory' | 'part_time' | null {
  // Use Deputy's roster type/comment/custom field if available
  const comment = (dep.Comment || dep.MatchedByTimesheet?.Comment || '').toLowerCase();
  if (comment.includes('inventory')) return 'inventory';

  // Infer from shift start time
  if (!dep.StartTime) return null;
  const startHour = new Date(dep.StartTime * 1000).getUTCHours();
  const duration = dep.EndTime && dep.StartTime ? (dep.EndTime - dep.StartTime) / 3600 : 0;

  // Short shifts are part-time
  if (duration > 0 && duration < 5) return 'part_time';

  // Early morning = opening, late start = closing, otherwise mid
  if (startHour <= 9) return 'opening';
  if (startHour >= 14) return 'closing';
  return 'mid';
}

function mapLeaveStatus(status: number): 'pending' | 'approved' | 'declined' | 'cancelled' {
  // Deputy: 0=Pending, 1=Approved, 2=Declined, 3=Cancelled
  const map: Record<number, 'pending' | 'approved' | 'declined' | 'cancelled'> = {
    0: 'pending',
    1: 'approved',
    2: 'declined',
    3: 'cancelled',
  };
  return map[status] ?? 'pending';
}

function epochToDate(epoch: number): string | null {
  if (!epoch || epoch <= 0) return null;
  const d = new Date(epoch * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function epochToTimestamp(epoch: number): string | null {
  if (!epoch || epoch <= 0) return null;
  const d = new Date(epoch * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatAddress(dep: any): string | null {
  const parts = [dep.Street, dep.City, dep.State, dep.Postcode, dep.Country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}
