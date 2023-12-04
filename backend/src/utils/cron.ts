import { NodeSSH } from 'node-ssh';
import axios from 'axios';



const ssh = new NodeSSH();

interface SSHConfig {
    host: string;
    username: string;
}

// SSH Configuration for the Remote Server
const sshConfig: SSHConfig = {
    host: '54.226.234.137',
    username: 'ec2-user',
};

async function fetchPrivateKey(url: string): Promise<string> {
    const response = await axios.get(url);
    return response.data;
}

// Function to add a cron job on the remote server
export async function addCronJob(jobName: string, args: string[]): Promise<void> {
    try {
        console.log('Connecting to remote server...');
        const privateKey = await fetchPrivateKey('https://visualith-quickconnect.s3.amazonaws.com/jenkins-server-5.pem');

        await ssh.connect({
            host: sshConfig.host,
            username: sshConfig.username,
            privateKey
        });
        console.log(`Connected to ${sshConfig.host}`);

        const scriptPath = '/home/ec2-user/script.sh';
        const argsString = args.join(' ');

        // Add a cron job to run hourly
        const hourlyJob = `0 * * * * ${scriptPath} ${argsString} # ${jobName}`;
        const addHourlyJobCommand = `(crontab -l 2>/dev/null; echo "${hourlyJob}") | crontab -`;

        console.log(`Adding hourly cron job: ${jobName}`);
        await ssh.execCommand(addHourlyJobCommand);

        console.log(`Cron job '${jobName}' added successfully.`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        ssh.dispose();
        console.log('Disconnected from the server.');
    }
}



// Function to remove a cron job from the remote server
export async function removeCronJob(jobName: string): Promise<void> {
    try {
        console.log('Connecting to remote server...');
        const privateKey = await fetchPrivateKey('https://visualith-quickconnect.s3.amazonaws.com/jenkins-server-5.pem');

        await ssh.connect({
            host: sshConfig.host,
            username: sshConfig.username,
            privateKey
        });
        console.log(`Connected to ${sshConfig.host}`);

        // Here, jobName is used as a comment in the cron job to identify it
        const removeCronJobCommand = `(crontab -l 2>/dev/null | grep -v '# ${jobName}') | crontab -`;

        console.log(`Removing cron job: ${jobName}`);
        await ssh.execCommand(removeCronJobCommand);
        console.log(`Cron job '${jobName}' removed successfully.`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        ssh.dispose();
        console.log('Disconnected from the server.');
    }
}

export async function executeScriptAndGetVPA(args: string[]): Promise<any> {
    try {
        console.log('Connecting to remote server...');
        const privateKey = await fetchPrivateKey('https://visualith-quickconnect.s3.amazonaws.com/jenkins-server-5.pem');

        await ssh.connect({
            host: sshConfig.host,
            username: sshConfig.username,
            privateKey
        });

        console.log(`Connected to ${sshConfig.host}`);

        // Prepare the command with arguments
        const scriptPath = '/home/ec2-user/script.sh'; 
        const argsString = args.join(' ');
        const scriptExecutionCommand = `${scriptPath} ${argsString}`;

        console.log(`Executing script: ${scriptExecutionCommand}`);
        const scriptResult = await ssh.execCommand(scriptExecutionCommand);

        if (scriptResult.code === 0) {
            console.log("Script Output: ", scriptResult.stdout);
            // Parse the output to extract VPA details
            const vpaDetails = parseVPADetails(scriptResult.stdout);
            console.log("VPA Details: ", vpaDetails);
            return vpaDetails;
        } else {
            console.error("Error executing script: ", scriptResult.stderr);
            throw new Error("Error executing script");
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    } finally {
        ssh.dispose();
        console.log('Disconnected from the server.');
    }
}

function parseVPADetails(output: string): any {
    const vpaDetails: any = {};
    const lines = output.split('\n');

    for (const line of lines) {
        if (line.includes("VPA CPU Request Recommendation:")) {
            vpaDetails.cpuRequest = line.split(':')[1].trim();
        } else if (line.includes("VPA Memory Request Recommendation:")) {
            vpaDetails.memoryRequestBytes = line.split(':')[1].trim();
        } else if (line.includes("VPA CPU Limit Recommendation:")) {
            vpaDetails.cpuLimit = line.split(':')[1].trim();
        } else if (line.includes("VPA Memory Limit Recommendation:")) {
            vpaDetails.memoryLimitBytes = line.split(':')[1].trim();
        }
    }

    return vpaDetails;
}