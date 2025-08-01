import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    PanResponder,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function JoystickShootingGame() {
    const [bullets, setBullets] = useState<{ x: number; y: number; id: number }[]>([]);
    const [enemies, setEnemies] = useState<{ x: number; y: number; id: number }[]>([]);
    const [score, setScore] = useState(0);
    const [playerX, setPlayerX] = useState(width / 2 - 15);
    const [playerY, setPlayerY] = useState(height - 120);
    const [gameOver, setGameOver] = useState(false);

    // Joystick state
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const playerWidth = 30;
    const playerHeight = 30;
    const joystickSize = 80;
    const knobSize = 30;
    const maxDistance = (joystickSize - knobSize) / 2;

    const bulletIdRef = useRef(0);
    const enemyIdRef = useRef(0);
    const gameLoopRef = useRef<any>(null);
    const moveIntervalRef = useRef<any>(null);
    const shootIntervalRef = useRef<any>(null);

    // Joystick pan responder
    const joystickPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsDragging(true);
            },
            onPanResponderMove: (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= maxDistance) {
                    setJoystickPos({ x: dx, y: dy });
                } else {
                    // Limit to circle boundary
                    const angle = Math.atan2(dy, dx);
                    setJoystickPos({
                        x: Math.cos(angle) * maxDistance,
                        y: Math.sin(angle) * maxDistance
                    });
                }
            },
            onPanResponderRelease: () => {
                setIsDragging(false);
                setJoystickPos({ x: 0, y: 0 });
            },
        })
    ).current;

    // Player movement based on joystick
    useEffect(() => {
        if (isDragging && (joystickPos.x !== 0 || joystickPos.y !== 0)) {
            moveIntervalRef.current = setInterval(() => {
                setPlayerX(prevX => {
                    const speed = 5;
                    const newX = prevX + (joystickPos.x / maxDistance) * speed;
                    return Math.max(0, Math.min(newX, width - playerWidth));
                });

                setPlayerY(prevY => {
                    const speed = 5;
                    const newY = prevY + (joystickPos.y / maxDistance) * speed;
                    return Math.max(50, Math.min(newY, height - playerHeight - 50));
                });
            }, 16); // ~60fps
        } else {
            if (moveIntervalRef.current) {
                clearInterval(moveIntervalRef.current);
            }
        }

        return () => {
            if (moveIntervalRef.current) {
                clearInterval(moveIntervalRef.current);
            }
        };
    }, [isDragging, joystickPos, maxDistance, playerWidth, playerHeight]);

    // Auto shooting
    useEffect(() => {
        if (!gameOver) {
            shootIntervalRef.current = setInterval(() => {
                setBullets(prev => [...prev, {
                    x: playerX + playerWidth / 2 - 2,
                    y: playerY - 5,
                    id: bulletIdRef.current++
                }]);
            }, 300);
        }

        return () => {
            if (shootIntervalRef.current) {
                clearInterval(shootIntervalRef.current);
            }
        };
    }, [gameOver, playerX, playerY, playerWidth]);

    // Enemy generation
    useEffect(() => {
        if (gameOver) return;

        const interval = setInterval(() => {
            setEnemies(prev => [...prev, {
                x: Math.random() * (width - 30),
                y: 0,
                id: enemyIdRef.current++
            }]);
        }, 1000);

        return () => clearInterval(interval);
    }, [gameOver]);

    // Main game loop - COMPLETELY INDEPENDENT of player position
    useEffect(() => {
        if (gameOver) return;

        gameLoopRef.current = setInterval(() => {
            // Move bullets up
            setBullets(prev => prev
                .map(bullet => ({ ...bullet, y: bullet.y - 8 }))
                .filter(bullet => bullet.y > 0)
            );

            // Move enemies down
            setEnemies(prev => prev
                .map(enemy => ({ ...enemy, y: enemy.y + 3 }))
                .filter(enemy => enemy.y < height)
            );

            // Check bullet-enemy collisions
            setBullets(prevBullets => {
                setEnemies(prevEnemies => {
                    let hitCount = 0;
                    const survivingEnemies = prevEnemies.filter(enemy => {
                        const hit = prevBullets.some(bullet =>
                            Math.abs(bullet.x - enemy.x) < 20 &&
                            Math.abs(bullet.y - enemy.y) < 20
                        );
                        if (hit) {
                            hitCount++;
                            return false;
                        }
                        return true;
                    });

                    if (hitCount > 0) {
                        setScore(s => s + hitCount);
                    }

                    return survivingEnemies;
                });

                return prevBullets.filter(bullet => {
                    // Use current enemies state for filtering
                    return !enemies.some(enemy =>
                        Math.abs(bullet.x - enemy.x) < 20 &&
                        Math.abs(bullet.y - enemy.y) < 20
                    );
                });
            });

        }, 50);

        return () => {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
            }
        };
    }, [gameOver]); // ONLY gameOver dependency!

    // Separate collision detection for player - runs independently
    useEffect(() => {
        if (gameOver) return;

        const collisionCheck = setInterval(() => {
            // Get current state values
            setEnemies(currentEnemies => {
                setPlayerX(currentPlayerX => {
                    setPlayerY(currentPlayerY => {
                        const collision = currentEnemies.some(enemy =>
                            Math.abs(enemy.x - currentPlayerX) < 25 &&
                            Math.abs(enemy.y - currentPlayerY) < 25
                        );
                        if (collision) {
                            setGameOver(true);
                        }
                        return currentPlayerY;
                    });
                    return currentPlayerX;
                });
                return currentEnemies;
            });
        }, 50);

        return () => clearInterval(collisionCheck);
    }, [gameOver]); // Only depends on gameOver

    const resetGame = () => {
        setBullets([]);
        setEnemies([]);
        setScore(0);
        setGameOver(false);
        setPlayerX(width / 2 - 15);
        setPlayerY(height - 120);
        bulletIdRef.current = 0;
        enemyIdRef.current = 0;
        setJoystickPos({ x: 0, y: 0 });
        setIsDragging(false);
    };

    return (
        <View style={styles.container}>
            {/* Game UI */}
            <View style={styles.ui}>
                <Text style={styles.score}>Score: {score}</Text>
                <Text style={styles.autoShootText}>🔥 AUTO SHOOT</Text>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
                <Text style={styles.instructionText}>🕹️ Use joystick to move rocket</Text>
                <Text style={styles.instructionText}>🔥 Auto shooting enabled</Text>
            </View>

            {/* Player rocket */}
            <View
                style={[
                    styles.player,
                    { left: playerX, top: playerY, width: playerWidth, height: playerHeight }
                ]}
            >
                <Text style={styles.playerIcon}>🚀</Text>
            </View>

            {/* Bullets */}
            {bullets.map((bullet) => (
                <View
                    key={`bullet-${bullet.id}`}
                    style={[styles.bullet, { left: bullet.x, top: bullet.y }]}
                />
            ))}

            {/* Enemies */}
            {enemies.map((enemy) => (
                <View
                    key={`enemy-${enemy.id}`}
                    style={[styles.enemy, { left: enemy.x, top: enemy.y }]}
                >
                    <Text style={styles.enemyIcon}>👾</Text>
                </View>
            ))}

            {/* Joystick */}
            <View style={styles.joystickContainer}>
                <View style={styles.joystickBase} {...joystickPanResponder.panHandlers}>
                    <View
                        style={[
                            styles.joystickKnob,
                            {
                                transform: [
                                    { translateX: joystickPos.x },
                                    { translateY: joystickPos.y }
                                ]
                            }
                        ]}
                    />
                </View>
                <Text style={styles.joystickLabel}>MOVE</Text>
            </View>

            {/* Game Over overlay */}
            {gameOver && (
                <View style={styles.gameOverOverlay}>
                    <Text style={styles.gameOverText}>GAME OVER</Text>
                    <Text style={styles.scoreText}>Final Score: {score}</Text>
                    <Text style={styles.gameOverSubtext}>
                        {score > 50 ? '🎉 Excellent!' : score > 20 ? '👍 Well done!' : '💪 Keep practicing!'}
                    </Text>
                    <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
                        <Text style={styles.restartText}>🔄 PLAY AGAIN</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        position: 'relative',
    },
    ui: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    score: {
        color: '#00ff00',
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 255, 0, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    autoShootText: {
        color: '#ff6400',
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: 'rgba(255, 100, 0, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ff6400',
    },
    instructions: {
        position: 'absolute',
        top: 80,
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 10,
    },
    instructionText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    player: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 255, 0, 0.2)',
        borderRadius: 15,
        zIndex: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#00ff00',
    },
    playerIcon: {
        fontSize: 20,
        textAlign: 'center',
    },
    bullet: {
        position: 'absolute',
        width: 4,
        height: 12,
        backgroundColor: '#00ff00',
        borderRadius: 2,
        zIndex: 3,
        shadowColor: '#00ff00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    enemy: {
        position: 'absolute',
        width: 30,
        height: 30,
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        borderRadius: 15,
        zIndex: 3,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ff0000',
    },
    enemyIcon: {
        fontSize: 18,
        textAlign: 'center',
    },
    joystickContainer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        alignItems: 'center',
        zIndex: 10,
    },
    joystickBase: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    joystickKnob: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    joystickLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    gameOverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    gameOverText: {
        color: '#ff0000',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 10,
        textShadowColor: 'rgba(255, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    scoreText: {
        color: '#00ff00',
        fontSize: 24,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    gameOverSubtext: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 30,
    },
    restartButton: {
        backgroundColor: '#00ff00',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
        shadowColor: '#00ff00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    restartText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});