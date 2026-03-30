const http = require('http');
http.get('http://localhost:3000', (res) => {
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      if (res.statusCode === 500) {
        const titleMatch = rawData.match(/<title>(.+?)<\/title>/);
        console.log('Error Title:', titleMatch ? titleMatch[1] : 'No title');
        
        const nextDataMatch = rawData.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
        if (nextDataMatch) {
          const data = JSON.parse(nextDataMatch[1]);
          console.log('Next Data Error Info:', JSON.stringify(data.err || 'No err object in __NEXT_DATA__', null, 2));
        } else {
          // just grab some plain text from the HTML
          const textMatches = rawData.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').match(/.{1,200}/g);
          console.log('Extracted HTML text starts with:', textMatches && textMatches.slice(0, 3).join('\n'));
        }
      } else {
        console.log('Status code was not 500:', res.statusCode);
      }
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
