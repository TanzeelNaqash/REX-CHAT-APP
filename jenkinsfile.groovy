pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS = credentials('DockerCred')
        DOCKER_USER = credentials('Dockeruser')
        URL = credentials('url')
    }

    stages {
        stage('Git Checkout') {
            steps {
                git branch: 'main', url: "$URL"
                echo "Checking git branch"
            }
        }

        stage('Build Stage') {
            steps {
                script {
                    def images = ['client-image', 'server-image']
                    for (image in images) {
                        echo "Building $image"
                        sh "docker build -t $DOCKER_USER/$image:v2 ."
                    }
                }
            }
        }

        stage('Docker Push and Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DockerCred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                    echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                    """
                    sh """
                    docker push \$DOCKER_USER/client-image:v2
                    docker push \$DOCKER_USER/server-image:v2
                    """
                }
            }
        }

        stage('Email Notification') {
            steps {
                script {
                    emailext(
                        subject: "Docker Images Pushed Successfully",
                        body: "The Docker images client-image and server-image have been successfully pushed to DockerHub.",
                        to: "raseebriyazkhan@gmail.com"
                    )
                }
            }
        }
    }
}

