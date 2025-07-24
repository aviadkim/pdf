// Monitor deployment
const check = async () => {
    const res = await fetch('https://pdf-fzzi.onrender.com/api/diagnostic');
    const data = await res.json();
    console.log(new Date().toLocaleTimeString(), '- Version:', data.version);
    
    const claude = await fetch('https://pdf-fzzi.onrender.com/api/claude-test');
    const cdata = await claude.json();
    console.log('Claude API:', cdata.error ? 'Not configured' : 'Ready');
    
    return data.version !== 'v3.1-quality-fixes';
};

const run = async () => {
    console.log('Monitoring deployment...\n');
    let done = false;
    while (!done) {
        done = await check();
        if (!done) await new Promise(r => setTimeout(r, 10000));
        else console.log('\n✅ DEPLOYED!');
    }
};

run();