export async function up({ queryAll, run }){
  // MySQL: check column existence
  const rows = await queryAll("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'user_id'");
  const hasUserId = Array.isArray(rows) && rows.length > 0;
  if(!hasUserId){
    await run('ALTER TABLE orders ADD COLUMN user_id INTEGER NULL');
  }
}
