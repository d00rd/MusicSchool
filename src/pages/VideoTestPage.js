import React from 'react';
import ReactPlayer from 'react-player';

// Use a known, reliable, publicly embeddable URL for testing
const TEST_VIDEO_URL = "https://www.youtube.com/watch?v=M7lc1UVf-VE"; 

function VideoTestPage() {
  

  const handlePlay = () => {
    console.log("Video started playing!");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Video Player Test Page</h1>
      <p style={styles.note}>
        If you see the video below and it plays, the issue is **data fetching/field name** in your lesson page, not the player itself.
      </p>

      {/* Video Player */}
      <div style={styles.videoPlayerWrapper}>
        <ReactPlayer 
          url={TEST_VIDEO_URL}
          controls={true}
          playing={false} // Don't autoplay
          onPlay={handlePlay}
          // Essential sizing properties
          width="100%"
          height="100%"
        />
      </div>
      
      {/* Fallback Check for debugging */}
      {!TEST_VIDEO_URL && (
        <p style={{ color: 'red' }}>TEST_VIDEO_URL is missing!</p>
      )}

    </div>
  );
}

export default VideoTestPage;

const styles = {
  container: {
    padding: "40px",
    backgroundColor: "#f0f2f5",
    minHeight: "100vh",
    textAlign: "center",
  },
  title: {
    marginBottom: "20px",
  },
  note: {
    color: "#666",
    marginBottom: "30px",
  },
  // This wrapper ensures the ReactPlayer has explicit dimensions to fill
  videoPlayerWrapper: { 
    width: "100%",
    maxWidth: "800px", // Max width of the player
    aspectRatio: "16/9", // Standard video ratio (16:9)
    margin: "0 auto 30px",
    borderRadius: "10px",
    overflow: "hidden", 
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
};