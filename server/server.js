const express = require('express');
const cors = require('cors');
const { parse } = require('csv-parse/sync');
const { spawn } = require('child_process');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.text()); // To handle text/plain input

app.post('/predict', (req, res) => {
    console.log('Received request body:', req.body); // Log the raw request body
    let data;

    if (req.is('text/plain') || req.is('text/csv')) {
        try {
            const parsedData = parse(req.body, { columns: false, skip_empty_lines: true, relax: true });
            console.log('Parsed CSV data:', parsedData);
            if (parsedData.length === 0) {
                return res.status(400).send('No data in CSV');
            }
            data = parsedData[0]; // Take the first row
            const headers = ['age', 'adhd_status', 'playtime_min', 'session_incomplete', 'sc_er', 'sc_de', 'sc_tct', 'sc_rtv', 'wfs_fpr', 'wfs_prc', 'wfs_rt', 'wfs_gs', 'ft_cf', 'ft_mmv', 'ft_eii', 'ft_tp'];
            data = headers.reduce((obj, header, index) => {
                obj[header] = data[index] === undefined || data[index] === 'NaN' ? 0 : parseFloat(data[index]) || 0;
                return obj;
            }, {});
            delete data.adhd_status;
        } catch (parseError) {
            console.error('CSV Parse Error:', parseError);
            return res.status(400).send('Invalid CSV format');
        }
    } else if (req.is('application/json')) {
        data = req.body;
        delete data.adhd_status;
    } else {
        console.error('Unsupported content type:', req.get('content-type'));
        return res.status(400).send('Unsupported content type');
    }

    if (!data) {
        console.error('No valid data processed');
        return res.status(400).send('No valid data provided');
    }

    const pythonProcess = spawn('python', ['../model/model.py'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    let result = '';
    pythonProcess.stdout.on('data', (data) => {
        result += data.toString().trim(); // Accumulate and trim output
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error('Python Error:', data.toString());
    });

    pythonProcess.on('close', (code) => {
        console.log('Raw Python Output:', result); // Log the raw output for debugging
        if (code === 0) {
            try {
                if (!result) {
                    throw new Error('Empty response from model');
                }
                const jsonResult = JSON.parse(result);
                res.json(jsonResult);
            } catch (jsonError) {
                console.error('JSON Parse Error:', jsonError.message);
                res.status(500).send('Invalid response from model');
            }
        } else {
            console.error(`Python process exited with code ${code}`);
            res.status(500).send('Error running prediction');
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});