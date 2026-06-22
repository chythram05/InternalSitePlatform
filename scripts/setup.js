const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command) {
  try {
    const result = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

function getWorkerNameFromConfig() {
  const configFiles = ['wrangler.jsonc', 'wrangler.json', 'wrangler.toml'];
  
  for (const configFile of configFiles) {
    const configPath = path.join(process.cwd(), configFile);
    
    if (fs.existsSync(configPath)) {
      log('blue', `📄 Found configuration: ${configFile}`);
      
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        let workerName;
        
        if (configFile.endsWith('.toml')) {
          const nameMatch = configContent.match(/^name\s*=\s*['"](.*?)['"]$/m);
          workerName = nameMatch ? nameMatch[1] : null;
        } else {
          const cleanedContent = configContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
          const config = JSON.parse(cleanedContent);
          workerName = config.name;
        }
        
        if (workerName) {
          log('green', `✅ Worker name: '${workerName}'`);
          return workerName;
        }
      } catch (error) {
        log('yellow', `⚠️  Could not parse ${configFile}: ${error.message}`);
      }
    }
  }
  
  return null;
}

function getDispatchNamespaceFromConfig() {
  const configPath = path.join(process.cwd(), 'wrangler.toml');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  const configContent = fs.readFileSync(configPath, 'utf8');
  const namespaceMatch = configContent.match(/^DISPATCH_NAMESPACE_NAME\s*=\s*['"](.*?)['"]$/m);

  return namespaceMatch ? namespaceMatch[1] : null;
}

function main() {
  log('blue', '🚀 Setting up dispatch namespace...\n');
  
  try {
    // Get worker name from configuration
    const workerName = getWorkerNameFromConfig();
    
    if (!workerName) {
      log('red', '❌ Could not find worker name in configuration');
      log('yellow', '   Make sure your wrangler config has a "name" field');
      process.exit(1);
    }
    
    const dispatchNamespace = getDispatchNamespaceFromConfig() || workerName;

    // Create dispatch namespace using configured platform namespace.
    log('yellow', `📦 Creating dispatch namespace '${dispatchNamespace}'...`);
    const createResult = execCommand(`npx wrangler dispatch-namespace create ${dispatchNamespace}`);
    
    if (createResult.success) {
      log('green', `✅ Successfully created dispatch namespace '${dispatchNamespace}'`);
    } else if (
      createResult.output.includes('already exists') || 
      createResult.output.includes('namespace with that name already exists') ||
      createResult.output.includes('A namespace with this name already exists')
    ) {
      log('green', `✅ Dispatch namespace '${dispatchNamespace}' already exists`);
    } else {
      log('yellow', `⚠️  Namespace creation had issues: ${createResult.error}`);
      log('yellow', '   Continuing - deployment flow will handle this');
    }
    
    log('green', '\n✅ Namespace setup completed!');
    log('blue', '📋 Create the D1 database with `npx wrangler d1 create internal-sites-template` before deploy');
    log('blue', '📋 Database tables initialize automatically on first request');
    
  } catch (error) {
    log('red', `\n❌ Setup failed: ${error.message}`);
    log('yellow', '⚠️  Continuing - deployment flow will handle resources');
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { getWorkerNameFromConfig };
