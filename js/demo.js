(function() {

    // Variables to use later
    var uploadForm = document.querySelector('.upload');
    var uploadIcon = document.querySelector('.upload__icon');
    var canvas = document.querySelector('.upload__canvas');
    var canvasWidth = canvas.width = canvas.offsetWidth;
    var canvasHeight = canvas.height = canvas.offsetHeight;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var iconParticlesCount = 1;
    var animatingUpload = false;
    var playingIconAnimation = false;
    var iconAnimation, iconAnimationFrame, iconRect, droppedFiles, filesCount;

    // Create a new particle
    function createParticle(options) {
        var o = options || {};
        particles.push({
            'x': o.x, // particle position in the `x` axis
            'y': o.y, // particle position in the `y` axis
            'vx': o.vx, // in every update (animation frame) the particle will be translated this amount of pixels in `x` axis
            'vy': o.vy, // in every update (animation frame) the particle will be translated this amount of pixels in `y` axis
            'life': 0, // in every update (animation frame) the life will increase
            'death': o.death || Math.random() * 200, // consider the particle dead when the `life` reach this value
            'size': o.size || Math.floor((Math.random() * 2) + 1) // size of the particle
        });
    }

    // Loop to redraw the particles on every frame
    function loop() {
        addIconParticles(); // add new particles for the upload icon
        updateParticles(); // update all particles
        renderParticles(); // clear `canvas` and draw all particles
        iconAnimationFrame = requestAnimationFrame(loop); // loop
    }

    // Add new particles for the upload icon
    function addIconParticles() {
        iconRect = uploadIcon.getBoundingClientRect(); // get icon dimensions
        var i = iconParticlesCount; // how many particles we should add?
        while (i--) {
            // Add a new particle
            createParticle({
                x: iconRect.left + iconRect.width / 2 + rand(iconRect.width - 10), // position the particle along the icon width in the `x` axis
                y: iconRect.top + iconRect.height / 2, // position the particle centered in the `y` axis
                vx: 0, // the particle will not be moved in the `x` axis
                vy: Math.random() * 2 * iconParticlesCount // value to move the particle in the `y` axis, greater is faster
            });
        }
    }

    // Update the particles, removing the dead ones
    function updateParticles() {
        for (var i = 0; i < particles.length; i++) {
            if (particles[i].life > particles[i].death) {
                particles.splice(i, 1);
            } else {
                particles[i].x += particles[i].vx;
                particles[i].y += particles[i].vy;
                particles[i].life++;
            }
        }
    }

    // Clear the `canvas` and redraw every particle (rect)
    function renderParticles() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        for (var i = 0; i < particles.length; i++) {
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (1 - particles[i].life / particles[i].death) + ')';
            ctx.fillRect(particles[i].x, particles[i].y, particles[i].size, particles[i].size);
        }
    }

    // Add 100 particles for the icon (without render), so the animation will not look empty at first
    function initIconParticles() {
        var iconParticlesInitialLoop = 100;
        while (iconParticlesInitialLoop--) {
            addIconParticles();
            updateParticles();
        }
    }
    initIconParticles();

    // Alternating animation for the icon to translate in the `y` axis
    function initIconAnimation() {
        iconAnimation = anime({
            targets: uploadIcon,
            translateY: -10,
            duration: 800,
            easing: 'easeInOutQuad',
            direction: 'alternate',
            loop: true,
            autoplay: false // don't execute the animation yet, only on `drag` events (see later)
        });
    }
    initIconAnimation();

    // Play the icon animation (`translateY` and particles)
    function playIconAnimation() {
        if (!playingIconAnimation) {
            playingIconAnimation = true;
            iconAnimation.play();
            iconAnimationFrame = requestAnimationFrame(loop);
        }
    }

    // Pause the icon animation (`translateY` and particles)
    function pauseIconAnimation() {
        if (playingIconAnimation) {
            playingIconAnimation = false;
            iconAnimation.pause();
            cancelAnimationFrame(iconAnimationFrame);
        }
    }

    // Create a new particles on `drop` event
    function addParticlesOnDrop(x, y, delay) {
        // Add a few particles when the `drop` event is triggered
        var i = delay ? 0 : 20; // Only add extra particles for the first item dropped (no `delay`)
        while (i--) {
            createParticle({
                x: x + rand(30),
                y: y + rand(30),
                vx: rand(2),
                vy: rand(2),
                death: 60
            });
        }

        // Now add particles along the way where the user `drop` the files to the icon position
        // Learn more about this kind of animation in the `anime.js` documentation
        anime({
            targets: {x: x, y: y},
            x: iconRect.left + iconRect.width / 2,
            y: iconRect.top + iconRect.height / 2,
            duration: 500,
            delay: delay || 0,
            easing: 'easeInQuad',
            run: function (anim) {
                var target = anim.animatables[0].target;
                var i = 10;
                while (i--) {
                    createParticle({
                        x: target.x + rand(30),
                        y: target.y + rand(30),
                        vx: rand(2),
                        vy: rand(2),
                        death: 60
                    });
                }
            },
            complete: uploadIconAnimation // call the second part of the animation (below)
        });
    }

    // Translate and scale the upload icon
    function uploadIconAnimation() {
        iconParticlesCount += 2; // add more particles per frame, to get a speed up feeling
        anime.remove(uploadIcon); // stop current animations
        // Animate the icon using `translateY` and `scale`
        iconAnimation = anime({
            targets: uploadIcon,
            translateY: {
                value: -canvasHeight / 2 - iconRect.height,
                duration: 1000,
                easing: 'easeInBack'
            },
            scale: {
                value: '+=0.1',
                duration: 2000,
                elasticity: 800
            },
            complete: function () {
                // reset the icon and all animation variables to its initial state
                setTimeout(resetAll, 0);
            }
        });
    }

    // Reset the icon and all animation variables to its initial state
    function resetAll() {
        animatingUpload = false;
        cancelAnimationFrame(iconAnimationFrame);
        pauseIconAnimation();
        anime({
            targets: uploadIcon,
            translateY: 0,
            scale: 1,
            duration: 0
        });
        particles = [];
        iconParticlesCount = 1;
        renderParticles();
        initIconParticles();
        initIconAnimation();
    }

    // Preventing the unwanted behaviours
    ['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'].forEach(function (event) {
        document.addEventListener(event, function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // Show the upload component on `dragover` and `dragenter` events
    ['dragover', 'dragenter'].forEach(function (event) {
        document.addEventListener(event, function () {
            if (!animatingUpload) {
                uploadForm.classList.add('upload--active');
                playIconAnimation();
            }
        });
    });

    // Hide the upload component on `dragleave` and `dragend` events
    ['dragleave', 'dragend'].forEach(function (event) {
        document.addEventListener(event, function () {
            if (!animatingUpload) {
                uploadForm.classList.remove('upload--active');
                pauseIconAnimation();
            }
        });
    });

    // Handle the `drop` event
    document.addEventListener('drop', function (e) {
        if (!animatingUpload) { // If no animation in progress
            droppedFiles = e.dataTransfer.files; // the files that were dropped
            filesCount = droppedFiles.length > 3 ? 3 : droppedFiles.length; // the number of files (1-3) to perform the animations

            if (filesCount) {
                animatingUpload = true;

                // Add particles for every file loaded (max 3), also staggered (increasing delay)
                var i = filesCount;
                while (i--) {
                    addParticlesOnDrop(e.pageX + (i ? rand(100) : 0), e.pageY + (i ? rand(100) : 0), 200 * i);
                }

                // Hide the upload component after the animation
                setTimeout(function () {
                    uploadForm.classList.remove('upload--active');
                }, 1500 + filesCount * 150);

                // Here is the right place to call something like:
                // triggerFormSubmit();
                // A function to actually upload the files to the server

            } else { // If no files where dropped, just hide the upload component
                uploadForm.classList.remove('upload--active');
                pauseIconAnimation();
            }
        }
    });

    // Update the `canvas` size and reset the component on `resize` event
    window.addEventListener('resize', function () {
        uploadForm.classList.remove('upload--active');
        canvasWidth = canvas.width = canvas.offsetWidth;
        canvasHeight = canvas.height = canvas.offsetHeight;
        resetAll();
    });

    // Random utility
    function rand(value) {
        return Math.random() * value - value / 2;
    }

})();
