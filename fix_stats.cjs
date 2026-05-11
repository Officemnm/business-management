const fs = require('fs');

let code = fs.readFileSync('src/app/api/dashboard/stats/route.ts', 'utf8');

// Replace userId logic with username logic, and role check
code = code.replace(
  'const userId = payload.userId;',
  `const username = payload.username;
  const isAdmin = payload.role === "admin";`
);

// Replace createdBy: userId with appropriate filter
code = code.replace(
  /createdBy:\s*userId/g,
  '...(!isAdmin ? { createdBy: username } : {})'
);

code = code.replace(
  /collectedBy:\s*userId/g,
  '...(!isAdmin ? { collectedBy: username } : {})'
);

code = code.replace(
  /const userFilter = \{ createdBy: userId \};/g,
  'const userFilter = isAdmin ? {} : { createdBy: username };'
);

code = code.replace(
  /const customerFilter = \{ createdBy: userId, active: true \};/g,
  `const customerFilter = isAdmin ? { active: true } : { createdBy: username, active: true };`
);

fs.writeFileSync('src/app/api/dashboard/stats/route.ts', code, 'utf8');
console.log("Stats API fixed");
