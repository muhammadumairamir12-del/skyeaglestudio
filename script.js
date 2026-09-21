document.addEventListener('DOMContentLoaded', () => {
    // ===== PAGE LOADER =====
    const loader = document.getElementById('loaderScreen');
    if (loader) {
        // Smooth transition out
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
            setTimeout(() => {
                loader.style.display = 'none';
                loader.setAttribute('aria-hidden', 'true');
            }, 400);
        }, 500);
    }

    // ===== NAV ACTIVE STATE BASED ON CURRENT URL =====
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === '/' && (currentPath === '/' || currentPath.endsWith('index.html') || currentPath === '')) {
            link.classList.add('active');
        } else if (linkPath !== '/' && currentPath.includes(linkPath)) {
            link.classList.add('active');
        }
    });

    // ===== CUSTOM CURSOR (DESKTOP ONLY) =====
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');
    
    // Check if it's a touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (cursor && cursorFollower && !isTouchDevice) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            
            setTimeout(() => {
                cursorFollower.style.left = e.clientX + 'px';
                cursorFollower.style.top = e.clientY + 'px';
            }, 80);
        });

        // Hover effects for links and buttons
        const hoverables = document.querySelectorAll('a, button, .filter-btn, .portfolio-item, .contact-widget, details');
        hoverables.forEach(item => {
            item.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(1.5)';
                cursor.style.borderColor = '#ff00f7';
                cursorFollower.style.transform = 'scale(1.8)';
                cursorFollower.style.borderColor = '#00f0ff';
            });
            item.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
                cursor.style.borderColor = '#00f0ff';
                cursorFollower.style.transform = 'scale(1)';
                cursorFollower.style.borderColor = '#ff00f7';
            });
        });
    } else {
        // Hide custom cursor elements on mobile/touch screens
        if (cursor) cursor.style.display = 'none';
        if (cursorFollower) cursorFollower.style.display = 'none';
    }

    // ===== HAMBURGER MOBILE MENU TOGGLE =====
    const hamburger = document.getElementById('navToggle');
    const navLinksList = document.querySelector('.nav-links');

    if (hamburger && navLinksList) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinksList.classList.toggle('active');
            
            if (navLinksList.classList.contains('active')) {
                document.body.classList.add('no-scroll');
            } else {
                document.body.classList.remove('no-scroll');
            }
        });

        // Close links when single link is clicked
        navLinksList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinksList.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });
    }

    // ===== HERO TYPEWRITER ANIMATION =====
    const typewriterElement = document.getElementById('typewriter');
    if (typewriterElement) {
        const texts = [
            'Websites & Web Apps',
            'Custom POS & Invoicing Systems',
            'iOS & Android Mobile Apps',
            'Scalable SaaS Platforms',
            'Generative AI Integrations',
            'Technical SEO & Speed Tuning'
        ];
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function typeWriter() {
            const currentText = texts[textIndex];
            
            if (!isDeleting) {
                typewriterElement.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
                
                if (charIndex === currentText.length) {
                    isDeleting = true;
                    setTimeout(typeWriter, 2000);
                    return;
                }
            } else {
                typewriterElement.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
                
                if (charIndex === 0) {
                    isDeleting = false;
                    textIndex = (textIndex + 1) % texts.length;
                }
            }
            
            setTimeout(typeWriter, isDeleting ? 50 : 100);
        }

        typeWriter();
    }

    // ===== SMOOTH SCROLL (ONLY ON LOCAL HASH LINKS) =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ===== FLOATING ORBS PARALLAX ON SCROLL =====
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.orb');
        
        parallaxElements.forEach((element, index) => {
            const speed = (index + 1) * 0.08;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // ===== CONTACT FORM & LEAD REDIRECTION =====
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        // Auto-select type based on URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const interest = urlParams.get('interest');
        if (interest) {
            const select = document.getElementById('formProjectType');
            if (select) {
                select.value = interest;
            }
        }

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Extract values
            const name = document.getElementById('formName').value;
            const email = document.getElementById('formEmail').value;
            const phone = document.getElementById('formPhone').value;
            const company = document.getElementById('formCompany').value || 'Not Specified';
            const projectType = document.getElementById('formProjectType').value;
            const budget = document.getElementById('formBudget').value;
            const details = document.getElementById('formDescription').value;
            
            // Save lead to Firestore if database is available
            if (window.db) {
                window.db.collection("leads").add({
                    name: name,
                    email: email,
                    phone: phone,
                    company: company,
                    projectType: projectType,
                    budget: budget,
                    description: details,
                    read: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }).then((docRef) => {
                    console.log("Lead recorded in Firebase with ID:", docRef.id);
                    return window.db.collection("users").add({
                        name: name,
                        email: email,
                        phone: phone,
                        company: company,
                        type: "contact",
                        date: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }).catch((error) => {
                    console.error("Error recording lead in Firebase:", error);
                });
            } else {
                console.warn("Firestore database not initialized. Lead was not saved locally.");
            }
            
            // 1. Alert confirmation
            alert(`🎉 Assalam-o-Alaikum ${name}!\n\nThank you for your scoping inquiry regarding: "${projectType}". Our developers will analyze your requirements and get back to you shortly.\n\nWe will now redirect you to WhatsApp to discuss details directly.`);
            
            // 2. Format WhatsApp Redirect Message
            const whatsappText = `Assalam-o-Alaikum SkyEagle Studio!\n\nMy name is *${name}*.\nI am writing to discuss a *${projectType}* project.\n\n*Scoping Details:*\n- *Email:* ${email}\n- *Phone:* ${phone}\n- *Company:* ${company}\n- *Budget:* ${budget}\n- *Description:* ${details}`;
            const whatsappUrl = `https://wa.me/923188791637?text=${encodeURIComponent(whatsappText)}`;
            
            // Open in new tab and reset form
            window.open(whatsappUrl, '_blank');
            contactForm.reset();
        });
    }

    // ===== DYNAMIC PORTFOLIO RENDERER =====
    window.normalizeTechList = function(technologies) {
        if (Array.isArray(technologies)) return technologies.filter(Boolean);
        if (!technologies) return [];
        return String(technologies).split(',').map(t => t.trim()).filter(Boolean);
    };

    window.projectImageSrc = function(imageUrl, isInSubfolder = false) {
        if (!imageUrl) return '';
        if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:') || imageUrl.startsWith('/')) return imageUrl;
        const cleaned = String(imageUrl).replace(/^\.\.\//, '');
        return '/' + cleaned;
    };

    window.projectImageList = function(project) {
        if (!project) return [];
        const list = [];
        const push = (url) => {
            if (url && list.indexOf(url) === -1) list.push(url);
        };
        if (Array.isArray(project.imageUrls)) project.imageUrls.forEach(push);
        push(project.imageUrl);
        push(project.imageUrl2);
        return list.slice(0, 2);
    };

    window.isExternalLiveUrl = function(url) {
        return !!url && /^https?:\/\//i.test(url);
    };

    window.reviewLinkForProject = function(projectName, slug) {
        const params = new URLSearchParams();
        if (projectName) params.set('project', projectName);
        if (slug) params.set('slug', slug);
        return '/reviews?' + params.toString() + '#submitReviewFormSection';
    };

    window.buildShotGallery = function(images, alt, isInSubfolder, options) {
        options = options || {};
        const wrap = document.createElement('div');
        wrap.className = 'shot-gallery';
        const resolved = (images || []).map((src) => window.projectImageSrc(src, isInSubfolder)).filter(Boolean);
        const preferEager = options.eager === true;

        if (!resolved.length) {
            wrap.classList.add('is-empty');
            wrap.innerHTML = '<div class="shot-gallery-fallback"><i class="fas fa-image"></i><span>Screenshots coming soon</span></div>';
            return wrap;
        }

        resolved.forEach((src, i) => {
            const img = document.createElement('img');
            img.className = 'shot-gallery-img' + (i === 0 ? ' is-active' : '');
            img.src = src;
            img.alt = (alt || 'Project') + ' screenshot ' + (i + 1);
            img.decoding = 'async';
            img.loading = (preferEager && i === 0) ? 'eager' : 'lazy';
            if (i === 0 && preferEager) img.setAttribute('fetchpriority', 'high');
            else img.setAttribute('fetchpriority', 'low');
            if (!img.getAttribute('width')) {
                img.setAttribute('width', '1200');
                img.setAttribute('height', '750');
            }
            wrap.appendChild(img);
        });

        if (resolved.length > 1) {
            const prev = document.createElement('button');
            prev.type = 'button';
            prev.className = 'shot-nav prev';
            prev.setAttribute('aria-label', 'Previous screenshot');
            prev.innerHTML = '<i class="fas fa-chevron-left"></i>';

            const next = document.createElement('button');
            next.type = 'button';
            next.className = 'shot-nav next';
            next.setAttribute('aria-label', 'Next screenshot');
            next.innerHTML = '<i class="fas fa-chevron-right"></i>';

            const dots = document.createElement('div');
            dots.className = 'shot-dots';
            resolved.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'shot-dot' + (i === 0 ? ' is-active' : '');
                dot.setAttribute('aria-label', 'Show screenshot ' + (i + 1));
                dot.dataset.i = String(i);
                dots.appendChild(dot);
            });

            wrap.appendChild(prev);
            wrap.appendChild(next);
            wrap.appendChild(dots);

            let idx = 0;
            const show = (n) => {
                idx = (n + resolved.length) % resolved.length;
                wrap.querySelectorAll('.shot-gallery-img').forEach((el, i) => {
                    el.classList.toggle('is-active', i === idx);
                });
                wrap.querySelectorAll('.shot-dot').forEach((el, i) => {
                    el.classList.toggle('is-active', i === idx);
                });
            };
            prev.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); show(idx - 1); });
            next.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); show(idx + 1); });
            dots.querySelectorAll('.shot-dot').forEach((dot) => {
                dot.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); show(parseInt(dot.dataset.i, 10)); });
            });
        }

        return wrap;
    };

    window.appendProjectActions = function(container, project, options) {
        options = options || {};
        const actions = document.createElement('div');
        actions.className = 'project-split-actions';
        const liveUrl = project.liveUrl || '';
        const name = project.name || project.clientName || '';
        const slug = project.slug || project.projectSlug || '';

        if (window.isExternalLiveUrl(liveUrl)) {
            const live = document.createElement('a');
            live.className = 'btn btn-primary';
            live.href = liveUrl;
            live.target = '_blank';
            live.rel = 'noopener noreferrer';
            live.innerHTML = '<span>Visit Live Website &rarr;</span>';
            actions.appendChild(live);
        }

        if (slug && options.showCaseStudy !== false) {
            const study = document.createElement('a');
            study.className = 'btn btn-secondary';
            study.href = '/projects/' + slug;
            study.innerHTML = '<span>Case Study</span>';
            actions.appendChild(study);
        }

        const review = document.createElement('a');
        review.className = 'btn btn-secondary';
        review.href = window.reviewLinkForProject(name, slug);
        review.innerHTML = '<span>Leave a Review for This Project</span>';
        actions.appendChild(review);

        container.appendChild(actions);
        return actions;
    };

    window.createProjectSplitBlock = function(project, index, options) {
        options = options || {};
        const isInSubfolder = !!options.isInSubfolder;
        const mode = options.mode || 'portfolio';
        const technologies = window.normalizeTechList(project.technologies || project.techStack);
        const category = (project.category || 'Websites').toLowerCase();

        const item = document.createElement('article');
        item.className = 'project-split' + (index % 2 === 1 ? ' is-flip' : '');
        item.setAttribute('data-category', category);
        item.setAttribute('data-tags', technologies.join(', ').toLowerCase());

        const media = document.createElement('div');
        media.className = 'project-split-media';
        media.appendChild(window.buildShotGallery(window.projectImageList(project), project.name || project.clientName || 'Project', isInSubfolder));

        const copy = document.createElement('div');
        copy.className = 'project-split-copy';

        if (project.industry) {
            const badge = document.createElement('span');
            badge.className = 'portfolio-badge';
            badge.style.position = 'static';
            badge.style.display = 'inline-block';
            badge.style.marginBottom = '12px';
            badge.textContent = project.industry;
            copy.appendChild(badge);
        }

        if (project.type) {
            const type = document.createElement('span');
            type.className = 'portfolio-type';
            type.textContent = project.type;
            copy.appendChild(type);
        }

        const title = document.createElement('h3');
        title.className = 'portfolio-title';
        title.textContent = project.name || project.clientName || 'Untitled project';
        copy.appendChild(title);

        const storyProblem = project.problem || project.challenge || '';
        const storySolution = project.solution || '';
        const storyOutcome = project.outcome || '';
        const hasStory = !!(storyProblem || storySolution || storyOutcome || project.price);

        if (mode === 'journey' || (mode === 'portfolio' && hasStory && (storyProblem || storySolution))) {
            const fields = [
                ['Problem', storyProblem],
                ['Solution built', storySolution],
                ['Outcome', storyOutcome]
            ];
            fields.forEach(([label, value]) => {
                if (!value) return;
                const field = document.createElement('div');
                field.className = 'journey-card-field';
                field.innerHTML = '<span class="journey-field-label">' + label + '</span>';
                const p = document.createElement('p');
                p.textContent = value;
                field.appendChild(p);
                copy.appendChild(field);
            });
            if (project.price) {
                const price = document.createElement('p');
                price.className = 'journey-price';
                price.textContent = project.price;
                copy.appendChild(price);
            }
        } else if (project.description) {
            const desc = document.createElement('p');
            desc.className = 'portfolio-desc';
            desc.textContent = project.description;
            copy.appendChild(desc);
        }

        if (technologies.length) {
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'tech-tags';
            technologies.forEach((tech) => {
                const span = document.createElement('span');
                span.className = 'tech-tag';
                span.textContent = tech;
                tagsDiv.appendChild(span);
            });
            copy.appendChild(tagsDiv);
        }

        window.appendProjectActions(copy, {
            name: project.name || project.clientName,
            slug: project.slug || project.projectSlug,
            liveUrl: project.liveUrl
        }, { showCaseStudy: mode !== 'journey' ? true : !!project.slug });

        item.appendChild(media);
        item.appendChild(copy);
        return item;
    };

    window.JOURNEY_STORY_PROJECTS = {
        'alfazal-breakthrough': { slug: 'al-fazal-hospital', name: 'Al-Fazal Medical & Dental Hospital', liveUrl: 'https://www.al-fazalhospital.com/' },
        'alfazal-phase-two': { slug: 'al-fazal-hospital', name: 'Al-Fazal Medical & Dental Hospital', liveUrl: 'https://www.al-fazalhospital.com/' },
        'alfazal-phase-three': { slug: 'dental-clinics-management-software', name: 'Al-Fazal CRM Software', liveUrl: 'https://dental-clinics-software.vercel.app/' },
        'alfazal-phase-four': { slug: 'al-fazal-hospital', name: 'Al-Fazal Medical & Dental Hospital', liveUrl: 'https://www.al-fazalhospital.com/' },
        'alnoor-story': { slug: 'al-noor-solar-energy', name: 'Al-Noor Solar Energy', liveUrl: 'https://al-noorsolarenergy.com/' },
        'zmsolar-story': { slug: 'zm-solar-electric', name: 'ZM Solar Electric', liveUrl: 'https://zmsolarelectric.com/' },
        'binzareen-client-story': { slug: 'bin-zareen', name: 'Bin Zareen Solar', liveUrl: 'https://binzareen.com/' },
        'doorskill-product-story': { slug: 'doorskill', name: 'DoorSkill', liveUrl: 'https://www.doorskill.com/' },
        'besthair-client-story': { slug: 'best-hair-lahore', name: 'Best Hair Lahore', liveUrl: 'https://www.besthairlahore.com/' },
        'zeeshan-client-story': { slug: 'zeeshan-dental-clinic', name: 'Asad Zeeshan Dental Clinic Software', liveUrl: '' },
        'zepiva-product-story': { slug: 'zepiva', name: 'Zepiva', liveUrl: 'https://www.zepiva.com/' }
    };

    window.enhanceJourneyStories = function() {
        const stories = document.querySelectorAll('.journey-story');
        let visibleIndex = 0;
        stories.forEach((story) => {
            const meta = window.JOURNEY_STORY_PROJECTS[story.id] || {};
            const linked = (window.projectsData || []).find((p) => p.slug === meta.slug);
            const project = Object.assign({}, meta, linked || {});
            const name = project.name || meta.name || '';
            const slug = project.slug || meta.slug || '';
            const liveUrl = project.liveUrl || meta.liveUrl || '';

            if (story.dataset.enhanced === 'true') {
                const media = story.parentElement && story.parentElement.querySelector('.project-split-media');
                if (media) {
                    media.innerHTML = '';
                    media.appendChild(window.buildShotGallery(window.projectImageList(project), name, false));
                }
                return;
            }

            const split = document.createElement('div');
            split.className = 'project-split' + (visibleIndex % 2 === 1 ? ' is-flip' : '');
            visibleIndex += 1;

            const media = document.createElement('div');
            media.className = 'project-split-media';
            media.appendChild(window.buildShotGallery(window.projectImageList(project), name, false));

            story.parentNode.insertBefore(split, story);
            split.appendChild(media);
            split.appendChild(story);
            story.classList.add('project-split-copy');
            story.dataset.enhanced = 'true';

            const hasCasePage = !!(linked || ((window.projectsData || []).some((p) => p.slug === slug)));
            window.appendProjectActions(story, { name: name, slug: slug, liveUrl: liveUrl }, { showCaseStudy: hasCasePage });
        });
    };

    window.mergeRemoteProjects = function() {
        return new Promise((resolve) => {
            if (!window.db) {
                resolve(window.projectsData || []);
                return;
            }
            window.db.collection('portfolioProjects').get()
                .then((snapshot) => {
                    const bySlug = {};
                    (window.projectsData || []).forEach((p) => {
                        if (p && p.slug) bySlug[p.slug] = Object.assign({}, p);
                    });
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        const slug = data.slug || doc.id;
                        if (data.published === false || data.hidden === true) {
                            delete bySlug[slug];
                            return;
                        }
                        const local = bySlug[slug] || {};
                        const merged = Object.assign({}, local, data, {
                            slug: slug,
                            firestoreId: doc.id
                        });
                        // Never let empty Firestore fields wipe richer local portfolio/case-study data
                        [
                            'liveUrl', 'imageUrl', 'imageUrl2', 'imageUrls',
                            'challenge', 'problem', 'solution', 'outcome', 'price',
                            'clientName', 'description', 'technologies', 'techStack',
                            'name', 'industry', 'type', 'category'
                        ].forEach((key) => {
                            const remoteEmpty = merged[key] === '' || merged[key] == null
                                || (Array.isArray(merged[key]) && !merged[key].length);
                            if (remoteEmpty && local[key] !== undefined && local[key] !== ''
                                && !(Array.isArray(local[key]) && !local[key].length)) {
                                merged[key] = local[key];
                            }
                        });
                        bySlug[slug] = merged;
                    });
                    window.projectsData = Object.values(bySlug);
                    resolve(window.projectsData);
                })
                .catch((err) => {
                    console.warn("Remote projects merge skipped:", err);
                    resolve(window.projectsData || []);
                });
        });
    };

    window.createProjectCard = function(project, isInSubfolder = false) {
        const relativePrefix = isInSubfolder ? '../' : '';
        const technologies = window.normalizeTechList(project.technologies);
        const category = (project.category || 'Websites').toLowerCase();
        const liveUrl = project.liveUrl || '/contact';
        
        const item = document.createElement('div');
        item.className = 'portfolio-item';
        item.setAttribute('data-category', category);
        item.setAttribute('data-tags', technologies.join(', ').toLowerCase());
        
        // Badge
        const badge = document.createElement('span');
        badge.className = 'portfolio-badge';
        badge.textContent = project.industry;
        item.appendChild(badge);
        
        // Asset Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'portfolio-asset-wrapper';
        
        if (project.imageUrl) {
            const img = document.createElement('img');
            img.src = window.projectImageSrc(project.imageUrl, isInSubfolder);
            img.alt = project.name;
            img.className = 'portfolio-image';
            img.loading = 'lazy';
            wrapper.appendChild(img);
        } else {
            // Fallback to CSS mockup graphic
            const frame = document.createElement('div');
            frame.className = 'custom-mockup-frame';
            frame.style.borderColor = project.mockupBorderColor || '#ff00f7';
            frame.style.padding = '25px';
            frame.style.height = '100%';
            frame.style.display = 'flex';
            frame.style.flexDirection = 'column';
            frame.style.justifyContent = 'center';
            
            const iconClass = project.mockupIcon || 'fa-globe';
            const subtitle = project.mockupSubtitle || 'Web Application';
            
            frame.innerHTML = `
                <div class="mockup-header" style="margin-bottom:10px;">
                    <span class="mock-dot red"></span>
                    <span class="mock-dot yellow"></span>
                    <span class="mock-dot green"></span>
                </div>
                <div class="mockup-body" style="padding:15px 0;">
                    <i class="fas ${iconClass}" style="font-size:2.5rem; color:${project.mockupBorderColor || '#ff00f7'}; margin-bottom:12px; display:block;"></i>
                    <h4 style="font-family:var(--font-heading); color:#fff; font-size:1rem; margin-bottom:5px;">${project.name}</h4>
                    <p style="color:#666; font-size:0.75rem; margin:0;">${subtitle}</p>
                </div>
            `;
            wrapper.appendChild(frame);
        }
        item.appendChild(wrapper);
        
        // Content
        const content = document.createElement('div');
        content.className = 'portfolio-content';
        
        const type = document.createElement('span');
        type.className = 'portfolio-type';
        type.textContent = project.type;
        content.appendChild(type);
        
        const title = document.createElement('h3');
        title.className = 'portfolio-title';
        title.textContent = project.name;
        content.appendChild(title);
        
        const desc = document.createElement('p');
        desc.className = 'portfolio-desc';
        desc.textContent = project.description;
        content.appendChild(desc);
        
        // Tech tags
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'tech-tags';
        technologies.forEach(tech => {
            const span = document.createElement('span');
            span.className = 'tech-tag';
            span.textContent = tech;
            tagsDiv.appendChild(span);
        });
        content.appendChild(tagsDiv);
        
        // Buttons
        const btnsDiv = document.createElement('div');
        btnsDiv.className = 'portfolio-buttons';
        
        const liveLink = document.createElement('a');
        liveLink.href = liveUrl.startsWith('contact.html') ? (relativePrefix + liveUrl) : liveUrl;
        liveLink.className = 'btn btn-primary';
        if (!liveUrl.startsWith('contact.html') && !liveUrl.startsWith('/contact')) {
            liveLink.target = '_blank';
            liveLink.rel = 'noopener noreferrer';
        }
        liveLink.innerHTML = (liveUrl.startsWith('contact.html') || liveUrl.startsWith('/contact')) ? 'Inquire <i class="fas fa-arrow-right" style="margin-left:4px;"></i>' : 'Live Site <i class="fas fa-external-link-alt" style="margin-left:4px;"></i>';
        btnsDiv.appendChild(liveLink);
        
        const caseLink = document.createElement('a');
        caseLink.href = `/projects/${project.slug}`;
        caseLink.className = 'btn btn-secondary';
        caseLink.textContent = 'Case Study';
        btnsDiv.appendChild(caseLink);
        
        content.appendChild(btnsDiv);
        item.appendChild(content);
        
        return item;
    };

    function bindPortfolioGrids() {
        const homeGrid = document.getElementById('featuredProjectsGrid');
        if (homeGrid && window.projectsData) {
            const featured = window.projectsData.slice(0, 7);
            homeGrid.innerHTML = '';
            featured.forEach(project => {
                homeGrid.appendChild(createProjectCard(project, false));
            });
        }

        const projectsGrid = document.getElementById('projectsGrid');
        if (projectsGrid && window.projectsData) {
            const searchInput = document.getElementById('projectSearch');
            const filterBtns = document.querySelectorAll('.filter-btn');
            const noResults = document.getElementById('noResultsAlert');
            
            let activeFilter = 'all';
            let searchQuery = '';

            function renderFilteredProjects() {
                projectsGrid.innerHTML = '';
                let visibleCount = 0;

                window.projectsData.forEach(project => {
                    const name = (project.name || '').toLowerCase();
                    const desc = (project.description || '').toLowerCase();
                    const category = (project.category || '').toLowerCase();
                    const tech = window.normalizeTechList(project.technologies).join(', ').toLowerCase();
                    const industry = (project.industry || '').toLowerCase();
                    const type = (project.type || '').toLowerCase();
                    
                    const matchesFilter = activeFilter === 'all' || 
                                          category === activeFilter ||
                                          (activeFilter === 'mobile apps' && type.includes('mobile')) ||
                                          (activeFilter === 'saas' && type.includes('saas')) ||
                                          (activeFilter === 'ai' && type.includes('ai')) ||
                                          (activeFilter === 'healthcare' && industry.includes('healthcare')) ||
                                          (activeFilter === 'real estate' && industry.includes('real estate'));
                    
                    const matchesSearch = name.includes(searchQuery) ||
                                          desc.includes(searchQuery) ||
                                          tech.includes(searchQuery) ||
                                          industry.includes(searchQuery) ||
                                          category.includes(searchQuery);

                    if (matchesFilter && matchesSearch) {
                        projectsGrid.appendChild(createProjectSplitBlock(project, visibleCount, { isInSubfolder: false, mode: 'portfolio' }));
                        visibleCount++;
                    }
                });

                if (noResults) {
                    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
                }
                
                if (typeof init3dTilt === 'function') {
                    init3dTilt();
                }
            }

            window._renderFilteredProjects = renderFilteredProjects;
            renderFilteredProjects();

            if (searchInput && !searchInput.dataset.bound) {
                searchInput.dataset.bound = 'true';
                searchInput.addEventListener('input', (e) => {
                    searchQuery = e.target.value.toLowerCase().trim();
                    renderFilteredProjects();
                });
            }

            filterBtns.forEach(btn => {
                if (btn.dataset.bound) return;
                btn.dataset.bound = 'true';
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    activeFilter = btn.getAttribute('data-filter').toLowerCase();
                    renderFilteredProjects();
                });
            });
        }
    }

    bindPortfolioGrids();
    if (typeof window.enhanceJourneyStories === 'function' && document.querySelector('.journey-story')) {
        window.enhanceJourneyStories();
    }
    if (typeof window.renderJourneyCaseStudies === 'function' && document.getElementById('journeyCaseStudiesGrid')) {
        window.renderJourneyCaseStudies('journeyCaseStudiesGrid');
    }
    window.mergeRemoteProjects().then(() => {
        bindPortfolioGrids();
        if (typeof window.enhanceJourneyStories === 'function' && document.querySelector('.journey-story')) {
            window.enhanceJourneyStories();
        }
        if (typeof window.renderJourneyCaseStudies === 'function' && document.getElementById('journeyCaseStudiesGrid')) {
            window.renderJourneyCaseStudies('journeyCaseStudiesGrid');
        }
        if (typeof window.onProjectsMerged === 'function') {
            window.onProjectsMerged(window.projectsData);
        }
    });

    // ===== 3D CARD TILT EFFECT =====
    function init3dTilt() {
        const tiltElements = document.querySelectorAll('.tilt-3d');
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouch) return;
        
        tiltElements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const maxRotation = 10; // degrees
                const rotateX = ((centerY - y) / centerY) * maxRotation;
                const rotateY = ((x - centerX) / centerX) * maxRotation;
                
                el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
            
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            });
        });
    }
    
    // Run initially for any static elements
    init3dTilt();
});
