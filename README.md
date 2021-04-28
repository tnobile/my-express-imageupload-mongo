# GridFS
GridFS basically takes a file and breaks it up into multiple chunks which are stored as individual documents in two collections:

- the chunk collection (stores the document parts), and
- the file collection (stores the consequent additional metadata).
- Each chunk is limited to 255 KB in size. This means that the last chunk is normally either equal to or less than 255 KB.
- When you read from GridFS, the driver reassembles all the chunks as needed.
- It is preferred to use GridFS for storing files normally exceeding the 16 MB size limit. For smaller files, it is recommended to use the BinData format to store the files in single documents.