const fs = require('fs');
const path = require('path');
const dir = 'packages/server/src/routes';

// Fix goal.routes.ts
let goal = fs.readFileSync(path.join(dir, 'goal.routes.ts'), 'utf8');
goal = goal.replace(/goalService\.createGoal\([^,]+,/g, 'goalService.createGoal(String(req.params.wid),');
goal = goal.replace(/logAuditAction\([^,]+,/g, 'logAuditAction(String(req.params.wid),');
goal = goal.replace(/getGoalsForWorkspace\([^\)]+\)/g, 'getGoalsForWorkspace(String(req.params.wid))');
goal = goal.replace(/goalService\.updateGoal\([^,]+,/g, 'goalService.updateGoal(String(req.params.gid),');
goal = goal.replace(/goalService\.deleteGoal\([^\)]+\)/g, 'goalService.deleteGoal(String(req.params.gid))');
goal = goal.replace(/logAuditAction\(String\(req\.params\.wid\), req\.user!\.userId, 'GOAL_DELETED', [^\)]+\)/g, "logAuditAction(String(req.params.wid), req.user!.userId, 'GOAL_DELETED', String(req.params.gid))");
fs.writeFileSync(path.join(dir, 'goal.routes.ts'), goal);

// Fix marathon.routes.ts
let marathon = fs.readFileSync(path.join(dir, 'marathon.routes.ts'), 'utf8');
marathon = marathon.replace(/marathonService\.createMarathon\([^,]+,/g, 'marathonService.createMarathon(String(req.params.wid),');
marathon = marathon.replace(/marathonService\.getActiveMarathon\([^\)]+\)/g, 'marathonService.getActiveMarathon(String(req.params.wid))');
marathon = marathon.replace(/logAuditAction\([^,]+,/g, 'logAuditAction(String(req.params.wid),');
marathon = marathon.replace(/marathonService\.updateMarathon\([^,]+,/g, 'marathonService.updateMarathon(String(req.params.mid),');
marathon = marathon.replace(/marathonService\.addTime\([^,]+,/g, 'marathonService.addTime(String(req.params.mid),');
marathon = marathon.replace(/marathonService\.pauseMarathon\([^\)]+\)/g, 'marathonService.pauseMarathon(String(req.params.mid))');
marathon = marathon.replace(/marathonService\.resumeMarathon\([^\)]+\)/g, 'marathonService.resumeMarathon(String(req.params.mid))');
marathon = marathon.replace(/marathonService\.endMarathon\([^\)]+\)/g, 'marathonService.endMarathon(String(req.params.mid))');
marathon = marathon.replace(/logAuditAction\(String\(req\.params\.wid\), req\.user!\.userId, 'MARATHON_[A-Z]+', [^\)]+\)/g, (match) => match.replace(/,\s*\([^)]+\)$/, ', String(req.params.mid)'));
fs.writeFileSync(path.join(dir, 'marathon.routes.ts'), marathon);

// Fix widget.routes.ts
let widget = fs.readFileSync(path.join(dir, 'widget.routes.ts'), 'utf8');
widget = widget.replace(/widgetService\.createWidget\([^,]+,/g, 'widgetService.createWidget(String(req.params.wid),');
widget = widget.replace(/widgetService\.getWidgetsForWorkspace\([^\)]+\)/g, 'widgetService.getWidgetsForWorkspace(String(req.params.wid))');
widget = widget.replace(/logAuditAction\([^,]+,/g, 'logAuditAction(String(req.params.wid),');
widget = widget.replace(/widgetService\.updateWidget\([^,]+,/g, 'widgetService.updateWidget(String(req.params.widgetId),');
widget = widget.replace(/widgetService\.deleteWidget\([^\)]+\)/g, 'widgetService.deleteWidget(String(req.params.widgetId))');
fs.writeFileSync(path.join(dir, 'widget.routes.ts'), widget);

// Fix donation.routes.ts
let donation = fs.readFileSync(path.join(dir, 'donation.routes.ts'), 'utf8');
donation = donation.replace(/donationService\.getDonations\([^,]+,/g, 'donationService.getDonations(String(req.params.wid),');
donation = donation.replace(/donationService\.getDonationStats\([^\)]+\)/g, 'donationService.getDonationStats(String(req.params.wid))');
donation = donation.replace(/donationService\.simulateDonation\([^,]+,/g, 'donationService.simulateDonation(String(req.params.wid),');
donation = donation.replace(/logAuditAction\([^,]+,/g, 'logAuditAction(String(req.params.wid),');
donation = donation.replace(/donationService\.updateDonationStatus\([^,]+,/g, 'donationService.updateDonationStatus(String(req.params.id),');
fs.writeFileSync(path.join(dir, 'donation.routes.ts'), donation);

// Fix workspace.routes.ts
let workspace = fs.readFileSync(path.join(dir, 'workspace.routes.ts'), 'utf8');
workspace = workspace.replace(/workspaceService\.getWorkspaceById\([^\)]+\)/g, 'workspaceService.getWorkspaceById(String(req.params.wid))');
workspace = workspace.replace(/workspaceService\.updateWorkspace\([^,]+,/g, 'workspaceService.updateWorkspace(String(req.params.wid),');
workspace = workspace.replace(/workspaceService\.deleteWorkspace\([^\)]+\)/g, 'workspaceService.deleteWorkspace(String(req.params.wid))');
workspace = workspace.replace(/logAuditAction\([^,]+,/g, 'logAuditAction(String(req.params.wid),');
workspace = workspace.replace(/workspaceService\.updateModeratorPermissions\([\s\S]*?req\.body/g, 'workspaceService.updateModeratorPermissions(String(req.params.wid), String(req.params.mid), req.body');
workspace = workspace.replace(/workspaceService\.removeMember\([\s\S]*?\)/g, 'workspaceService.removeMember(String(req.params.wid), String(req.params.mid))');
workspace = workspace.replace(/logAuditAction\(String\(req\.params\.wid\), req\.user!\.userId, 'MEMBER_REMOVED', [^\)]+\)/g, "logAuditAction(String(req.params.wid), req.user!.userId, 'MEMBER_REMOVED', String(req.params.mid))");
workspace = workspace.replace(/logAuditAction\(String\(req\.params\.wid\), req\.user!\.userId, 'MEMBER_PERMISSIONS_UPDATED', [^,]+,/g, "logAuditAction(String(req.params.wid), req.user!.userId, 'MEMBER_PERMISSIONS_UPDATED', String(req.params.mid),");
workspace = workspace.replace(/getAuditLogs\([^,]+,/g, 'getAuditLogs(String(req.params.wid),');
workspace = workspace.replace(/parseInt\([^)]+\)/g, (match) => {
  if (match.includes('page')) return 'parseInt(String(req.query.page))';
  if (match.includes('limit')) return 'parseInt(String(req.query.limit))';
  return match;
});
workspace = workspace.replace(/getWorkspaceAnalytics\([^\)]+\)/g, 'getWorkspaceAnalytics(String(req.params.wid))');
fs.writeFileSync(path.join(dir, 'workspace.routes.ts'), workspace);

console.log('Fixed all routes!');
