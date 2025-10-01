CREATE TABLE IF NOT EXISTS users (
    uid INT AUTO_INCREMENT PRIMARY KEY, 
    userID INT UNIQUE, 
    username VARCHAR(255),
    name VARCHAR(255),
    email VARCHAR(255),
    personalizedPrompt TEXT,
    fieldStudyOptIn BOOLEAN DEFAULT FALSE,
    fieldStudyOptInAt TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS conversations (
    uid VARCHAR(255) PRIMARY KEY, 
    userID INT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES users(userID)
);

CREATE TABLE IF NOT EXISTS interactions (
    uid INT AUTO_INCREMENT PRIMARY KEY, 
    userID INT, 
    conversationID VARCHAR(255), 
    userMessage TEXT, 
    code TEXT, 
    botResponse TEXT, 
    rating INT, 
    reason TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    FOREIGN KEY (userID) REFERENCES users(userID), 
    FOREIGN KEY (conversationID) REFERENCES conversations(uid)
);

CREATE TABLE IF NOT EXISTS personas (
    uid INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(255), 
    description TEXT,
    prompt TEXT
);


CREATE TABLE IF NOT EXISTS codefiles (
    uid INT AUTO_INCREMENT PRIMARY KEY,
    userID INT,
    filename VARCHAR(255),
    initialContent TEXT,
    currentContent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES users(userID)
);

CREATE TABLE IF NOT EXISTS codechanges (
    uid INT AUTO_INCREMENT PRIMARY KEY,
    fileID INT NOT NULL,
    diff TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fileID) REFERENCES codefiles(uid)
);
