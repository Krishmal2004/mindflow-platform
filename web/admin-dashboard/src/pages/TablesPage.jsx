import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import '../assets/css/TablesPage.css';

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getTables();
      setTables(data);
    } catch (err) {
      setError('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = async (tableName) => {
    setSelectedTable(tableName);
    setLoading(true);
    setError('');
    
    try {
      const data = await ApiService.getTableData(tableName);
      setTableData(data);
    } catch (err) {
      setError('Failed to fetch table data');
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await ApiService.deleteRecord(selectedTable, id);
        // Refresh the table data
        handleTableSelect(selectedTable);
      } catch (err) {
        setError('Failed to delete record');
      }
    }
  };

  const handleEdit = async (record) => {
    // In a real app, this would open a modal or form to edit the record
    const newData = prompt('Enter new data (JSON format):', JSON.stringify(record));
    if (newData) {
      try {
        const parsedData = JSON.parse(newData);
        await ApiService.updateRecord(selectedTable, record.id, parsedData);
        // Refresh the table data
        handleTableSelect(selectedTable);
      } catch (err) {
        setError('Failed to update record');
      }
    }
  };

  return (
    <div className="tables-page">
      <h2>Database Tables</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="tables-container">
        <div className="tables-list">
          <h3>Tables</h3>
          {loading && !tables.length ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading tables...</p>
            </div>
          ) : (
            <ul>
              {tables.map((table) => (
                <li 
                  key={table.name} 
                  className={selectedTable === table.name ? 'active' : ''}
                  onClick={() => handleTableSelect(table.name)}
                >
                  <span className="table-name">{table.name}</span>
                  <span className="table-rows">({table.rows} rows)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="table-data">
          <h3>{selectedTable ? selectedTable : 'Select a table'}</h3>
          {loading && selectedTable ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading table data...</p>
            </div>
          ) : selectedTable && !loading && tableData.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {Object.keys(tableData[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.id}>
                      {Object.values(row).map((value, index) => (
                        <td key={index}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>
                      ))}
                      <td>
                        <button className="edit-button" onClick={() => handleEdit(row)}>Edit</button>
                        <button className="delete-button" onClick={() => handleDelete(row.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedTable && !loading && tableData.length === 0 ? (
            <div className="no-data-message">
              <p>No data available for this table</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TablesPage;