pipeline {
    agent any

    environment {
        // Assume you have Docker installed on Jenkins agent
        IMAGE_NAME = "prayer-schedule"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Prepare Environment') {
            steps {
                withCredentials([file(credentialsId: 'prayer-schedule-env', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE .env'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${IMAGE_NAME}:latest .'
            }
        }
        
        stage('Deploy Container') {
            steps {
                // Stop and remove existing container if running
                sh 'docker rm -f ${IMAGE_NAME} || true'
                
                // Run the new container, exposing port 3001
                sh 'docker run -d --name ${IMAGE_NAME} -p 3001:3000 --restart always ${IMAGE_NAME}:latest'
            }
        }
    }
}
