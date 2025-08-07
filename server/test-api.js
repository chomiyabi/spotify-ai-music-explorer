const axios = require('axios');

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

const testAPIs = async () => {
  console.log('=== Spotify API Connection Test ===\n');

  try {
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    console.log('2. Testing Token Acquisition...');
    const tokenResponse = await axios.get(`${BASE_URL}/auth/token`);
    console.log('✅ Token Status:', tokenResponse.data);
    console.log('');

    console.log('3. Testing Search API...');
    const searchResponse = await axios.get(`${BASE_URL}/test/search`, {
      params: {
        q: 'Shape of You',
        type: 'track',
        limit: 5
      }
    });
    console.log('✅ Search Results:');
    console.log(`   Total Results: ${searchResponse.data.total}`);
    console.log(`   Returned: ${searchResponse.data.results.length} tracks`);
    searchResponse.data.results.forEach((track, index) => {
      console.log(`   ${index + 1}. ${track.name} - ${track.artists}`);
    });
    console.log('');

    console.log('4. Testing Top Tracks (Japan)...');
    const topTracksJP = await axios.get(`${BASE_URL}/test/top-tracks/jp`);
    console.log('✅ Japan Top Tracks:');
    console.log(`   Playlist: ${topTracksJP.data.playlist_name}`);
    console.log(`   Total Tracks: ${topTracksJP.data.total_tracks}`);
    console.log('   Top 5:');
    topTracksJP.data.tracks.slice(0, 5).forEach(track => {
      console.log(`   ${track.position}. ${track.name} - ${track.artists}`);
    });
    console.log('');

    console.log('5. Testing Top Tracks (Global)...');
    const topTracksGlobal = await axios.get(`${BASE_URL}/test/top-tracks/global`);
    console.log('✅ Global Top Tracks:');
    console.log(`   Playlist: ${topTracksGlobal.data.playlist_name}`);
    console.log(`   Total Tracks: ${topTracksGlobal.data.total_tracks}`);
    console.log('   Top 5:');
    topTracksGlobal.data.tracks.slice(0, 5).forEach(track => {
      console.log(`   ${track.position}. ${track.name} - ${track.artists}`);
    });
    console.log('');

    console.log('=== All Tests Passed Successfully! ===');

  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500 && error.response?.data?.error?.includes('Spotify API credentials')) {
      console.log('\n⚠️  Please configure your Spotify API credentials:');
      console.log('1. Go to https://developer.spotify.com/dashboard');
      console.log('2. Create a new app or use existing one');
      console.log('3. Copy Client ID and Client Secret');
      console.log('4. Add them to server/.env file:');
      console.log('   SPOTIFY_CLIENT_ID=your_client_id_here');
      console.log('   SPOTIFY_CLIENT_SECRET=your_client_secret_here');
    }
  }
};

console.log('Starting API tests...');
console.log('Make sure the server is running (npm run dev)\n');

setTimeout(() => {
  testAPIs();
}, 2000);