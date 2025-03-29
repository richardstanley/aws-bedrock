# Natural Language Query System - MVP Focus

## Overview
This proposal outlines a simple implementation of a natural language query system using Nova chatbot and AWS services. Users can ask questions in plain English, and the system will convert these into SQL queries and return results. The system is designed to be extensible, allowing future integration with data manipulation features and event-driven processing.

## Core Functionality

### 1. Natural Language Processing
- Nova chatbot for understanding user questions
- Conversion of questions to SQL queries
- Basic context management
- Simple error handling

### 2. Data Processing
- Athena for query execution
- S3 for result storage
- DynamoDB for chat history
- Basic caching

### 3. User Interface
- Simple chat interface
- Results display
- Basic error messages
- Loading states

## Architecture

### MVP/Core Architecture
```mermaid
graph TD
    subgraph Frontend
        A[Chat Interface] --> B[Results Display]
    end
    
    subgraph API Layer
        C[AppSync API] --> D[Lambda Functions]
    end
    
    subgraph Processing Layer
        E[Nova Chat] --> F[Athena]
    end
    
    subgraph Storage Layer
        G[S3 Results] --> H[DynamoDB History]
    end
    
    subgraph Security Layer
        I[Cognito Auth]
    end
    
    A --> C
    D --> E
    F --> G
    D --> H
    A --> I
    C --> I
```

### Future Enhancement Architecture
```mermaid
graph TD
    subgraph Frontend
        A[Chat Interface] --> B[Results Display]
        B --> C[Data Editor]
    end
    
    subgraph API Layer
        D[AppSync API] --> E[Lambda Functions]
    end
    
    subgraph Processing Layer
        F[Nova Chat] --> G[Athena]
    end
    
    subgraph Storage Layer
        H[S3 Results] --> I[DynamoDB History]
    end
    
    subgraph Event Layer
        J[SNS Topic] --> K[SQS Queue 1]
        J --> L[SQS Queue 2]
        J --> M[SQS Queue 3]
        K --> N[Zapier 1]
        L --> O[Zapier 2]
        M --> P[Zapier 3]
    end
    
    subgraph Security Layer
        Q[Cognito Auth]
    end
    
    A --> D
    E --> F
    G --> H
    E --> I
    A --> Q
    D --> Q
    C --> D
    E --> J
```

## Implementation Phases

### Phase 1: Core Setup (Week 1)
1. **Basic Infrastructure**
   - AWS CDK setup
   - Nova integration
   - Simple storage

2. **Core Services**
   - Chat processing
   - Query execution
   - Basic storage

### Phase 2: Integration (Week 2)
1. **Chat Integration**
   - Question processing
   - SQL generation
   - Result formatting

2. **Data Flow**
   - Query execution
   - Result storage
   - History tracking

## Technical Stack

### Core Services
- Nova API for natural language processing
- AWS Athena for query execution
- AWS S3 for result storage
- AWS DynamoDB for chat history
- AWS Cognito for authentication
- AWS AppSync for API

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Zustand for state

### Future Services
- AWS SNS for event publishing
- AWS SQS for queue management
- Zapier for external integrations

## Frontend Interface

### Browser Layout Mockup
```mermaid
graph TD
    subgraph BrowserWindow
        subgraph Header["Header (Fixed)"]
            A[Logo] --> B[User Profile]
            B --> C[Settings]
        end
        
        subgraph MainLayout["Main Layout (Flex)"]
            subgraph Sidebar["Sidebar (250px)"]
                D[Chat History]
                E[Saved Queries]
                F[Recent Results]
                G[Data Sources]
            end
            
            subgraph MainContent["Main Content (Flex-1)"]
                subgraph ChatSection["Chat Section"]
                    H[Message History]
                    I[Chat Input]
                end
                
                subgraph ResultsSection["Results Section"]
                    J[Results Table]
                    K[CSV Upload]
                    L[Schema Viewer]
                end
                
                subgraph StatusBar["Status Bar"]
                    M[Upload Status]
                    N[Processing Queue]
                end
            end
        end
    end
    
    style BrowserWindow fill:#f9f9f9,stroke:#333,stroke-width:2px
    style Header fill:#ffffff,stroke:#ddd,stroke-width:1px
    style Sidebar fill:#f5f5f5,stroke:#ddd,stroke-width:1px
    style MainContent fill:#ffffff,stroke:#ddd,stroke-width:1px
    style ChatSection fill:#ffffff,stroke:#ddd,stroke-width:1px
    style ResultsSection fill:#ffffff,stroke:#ddd,stroke-width:1px
    style StatusBar fill:#f0f0f0,stroke:#ddd,stroke-width:1px
```

### Component Layout Details

#### Header (Fixed)
- Height: 60px
- Background: White
- Border: Bottom 1px solid #ddd
- Components:
  - Logo (Left)
  - User Profile (Right)
  - Settings (Right)

#### Sidebar (Fixed Width)
- Width: 250px
- Background: Light gray (#f5f5f5)
- Border: Right 1px solid #ddd
- Components:
  - Chat History (Collapsible)
  - Saved Queries (Collapsible)
  - Recent Results (Collapsible)
  - Data Sources (Collapsible)

#### Main Content (Flex)
- Background: White
- Components:
  - Chat Section (Flex: 0 0 auto)
    - Message History (Scrollable)
    - Chat Input (Fixed height)
  - Results Section (Flex: 1)
    - Results Table (Scrollable)
    - CSV Upload (Collapsible)
    - Schema Viewer (Collapsible)
  - Status Bar (Fixed height)
    - Upload Status
    - Processing Queue

### Responsive Design
```mermaid
graph LR
    subgraph Desktop["Desktop (>= 1024px)"]
        A[Full Layout]
    end
    
    subgraph Tablet["Tablet (768px - 1023px)"]
        B[Collapsible Sidebar]
    end
    
    subgraph Mobile["Mobile (< 768px)"]
        C[Stacked Layout]
    end
    
    A --> B
    B --> C
```

### Color Scheme
```mermaid
graph TD
    subgraph Colors
        A[Primary: #2563eb] --> B[Background: #ffffff]
        A --> C[Secondary: #64748b]
        A --> D[Accent: #3b82f6]
        B --> E[Text: #1f2937]
        B --> F[Border: #e5e7eb]
    end
```

### Interactive States
```mermaid
graph TD
    subgraph States
        A[Default] --> B[Hover]
        B --> C[Active]
        C --> D[Loading]
        D --> E[Success]
        D --> F[Error]
    end
```

## Data Flow

### CSV Upload Process
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant S3
    participant Athena
    participant DynamoDB

    User->>Frontend: Select CSV file
    Frontend->>S3: Upload to bucket
    S3-->>Frontend: Upload complete
    Frontend->>Athena: Create table
    Athena-->>Frontend: Table created
    Frontend->>DynamoDB: Store metadata
    Frontend-->>User: Show success
```

### Query Process
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Nova
    participant Athena
    participant S3
    participant DynamoDB

    User->>Frontend: Ask question
    Frontend->>Nova: Process question
    Nova->>Athena: Generate & execute SQL
    Athena->>S3: Store results
    Athena->>Frontend: Return results
    Frontend->>DynamoDB: Save chat history
    Frontend->>User: Display results
```

## Success Criteria

### Core Functionality
- [ ] Users can ask questions in plain English
- [ ] Questions are converted to SQL queries
- [ ] Results are displayed clearly
- [ ] Chat history is maintained

### Performance
- [ ] Response time < 2s
- [ ] Query execution < 3s
- [ ] Basic error handling

### User Experience
- [ ] Simple chat interface
- [ ] Clear result display
- [ ] Basic error messages
- [ ] Loading indicators

## Testing Strategy

### Core Tests
```typescript
// Test natural language processing
async function testQuestionProcessing() {
  const question = "Show me sales for last month";
  const result = await processQuestion(question);
  assert(result.sql.includes("SELECT"));
  assert(result.sql.includes("sales"));
}

// Test query execution
async function testQueryExecution() {
  const sql = "SELECT * FROM sales LIMIT 1";
  const result = await executeQuery(sql);
  assert(result.rows.length > 0);
}

// Future: Test data manipulation
async function testDataManipulation() {
  const result = await executeQuery("SELECT * FROM sales LIMIT 1");
  const modifiedRow = await modifyRow(result.rows[0]);
  await publishToSNS(modifiedRow);
  // Verify SNS/SQS integration
}
```

## Future Enhancements

### 1. Data Manipulation
- Row-level editing
- Data deletion
- Batch operations
- Data validation

### 2. Event Processing
- SNS topic setup
- SQS queue configuration
- Zapier integration
- Event monitoring

### 3. Performance
- Query optimization
- Result caching
- Advanced monitoring
- Performance analytics

This proposal focuses on delivering a simple but effective natural language query system, with a clear path for future enhancements including data manipulation and event-driven processing through SNS/SQS queues. 