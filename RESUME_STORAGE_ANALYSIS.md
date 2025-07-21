# Resume Storage Analysis - AutoJobr

## **Current Resume Storage Architecture**

### **📊 Current Storage Breakdown**

**Database Storage:**
- **resumes table**: 3 resume records, 507KB total (169KB average per resume)
- **user_profiles table**: 4 profiles, 0 bytes resume data (unused columns)
- **File system**: 0 bytes (uploads/resumes/ directory empty)

**Per Resume Storage:**
- **Largest resume**: 284KB (ID 3, Shubham_Dubey_500076580_resume)
- **Average file_data**: 169KB per resume (Base64 encoded PDF)
- **Average resume_text**: 916 bytes (extracted text)

### **🗂️ Storage Locations**

#### **1. Primary Storage: `resumes` Table**
```sql
CREATE TABLE resumes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  name VARCHAR NOT NULL,
  file_name VARCHAR NOT NULL,
  file_data TEXT,              -- 📋 BASE64 ENCODED PDF FILES (169KB avg)
  resume_text TEXT,            -- 📝 EXTRACTED TEXT (916 bytes avg)
  ats_score INTEGER,           -- 🎯 AI ANALYSIS SCORE
  analysis_data JSONB,         -- 🤖 GROQ AI ANALYSIS RESULTS
  recommendations TEXT[],      -- 💡 ATS IMPROVEMENT SUGGESTIONS
  file_size INTEGER,
  mime_type VARCHAR,
  created_at TIMESTAMP
);
```

#### **2. Secondary Storage: `user_profiles` Table**
```sql
-- DUPLICATE SCHEMA (Currently unused - 0 bytes)
resume_url VARCHAR,
resume_text TEXT,
resume_file_name VARCHAR,
resume_data TEXT,              -- 📋 BASE64 ENCODED (unused)
resume_mime_type VARCHAR,
ats_score INTEGER,
ats_analysis JSONB,
ats_recommendations TEXT[]
```

#### **3. File System Storage: `server/fileStorage.ts`**
```typescript
// LOCAL FILE STORAGE (Currently unused - 0 bytes)
private resumesDir = './uploads/resumes';
// Files stored as: resume_${userId}_${timestamp}_${randomId}.pdf
// With optional .gz compression
```

### **💾 Storage Redundancy Issues**

**Problem 1: Duplicate Schema**
- Resume data columns exist in both `resumes` and `user_profiles` tables
- Only `resumes` table is actively used
- `user_profiles` resume columns are empty but still consume schema space

**Problem 2: Base64 Storage in Database**
- PDF files stored as Base64 text in database (33% size increase)
- 169KB average per resume = ~127KB actual PDF size
- Database optimized for queries, not binary storage

**Problem 3: Unused File System**
- `fileStorage.ts` service exists but files not persisted to disk
- `uploads/resumes/` directory empty despite upload processing

### **🔍 Data Flow Analysis**

**Upload Process:**
1. `POST /api/resume/upload` → Multer → Memory storage
2. PDF text extraction via pdf-parse
3. Groq AI analysis of extracted text
4. **Base64 encoding** of PDF → Database storage
5. File system storage **skipped**

**Retrieval Process:**
1. `GET /api/resumes` → Database query
2. Base64 decode for file downloads
3. File system **not accessed**

### **📈 Storage Optimization Opportunities**

#### **Immediate (30-50% reduction):**
1. **Remove duplicate schema** in `user_profiles`
2. **Move to file system** storage (remove Base64 overhead)
3. **Implement compression** for PDF files

#### **Medium-term (50-70% reduction):**
1. **Cloud storage** (S3, Cloudinary) for PDF files
2. **Database stores URLs only** instead of file data
3. **Implement cleanup** of old resume versions

#### **Long-term (70-85% reduction):**
1. **CDN integration** for resume serving
2. **Lazy loading** of resume content
3. **Archive old resumes** to cold storage

### **🎯 Recommended Action Plan**

**Phase 1: Fix Storage Architecture**
```javascript
// 1. Remove duplicate columns from user_profiles
// 2. Use file system storage properly
// 3. Store file paths instead of Base64 data
```

**Phase 2: Optimize File Handling**
```javascript
// 1. Implement cloud storage (S3/Cloudinary)
// 2. Add automatic compression
// 3. Create cleanup jobs for old files
```

**Phase 3: Advanced Optimization**
```javascript
// 1. Add CDN for resume serving
// 2. Implement progressive loading
// 3. Add storage analytics and monitoring
```

### **💰 Cost Impact**

**Current**: 169KB per resume × 1000 users = 169MB database storage
**Optimized**: 50 bytes per resume × 1000 users = 50KB database storage

**Storage reduction**: 99.97% reduction in database size
**Performance improvement**: Faster queries, reduced bandwidth
**Cost savings**: Significant reduction in cloud database costs

### **🚀 Next Steps**

1. **Implement file system storage** properly
2. **Migrate existing Base64 data** to files
3. **Remove redundant schema** columns
4. **Add cloud storage** integration
5. **Implement cleanup routines**

This analysis shows that resume storage is the primary consumer of database space and the biggest optimization opportunity.