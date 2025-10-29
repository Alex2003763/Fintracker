import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { AIInsight } from '../types';
import { SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon, LightBulbIcon } from './icons';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

interface AISwiperCardProps {
    insights: AIInsight;
}

const AISwiperCard: React.FC<AISwiperCardProps> = ({ insights }) => {
    return (
        <div className="w-full">
            <Swiper
                modules={[Pagination]}
                spaceBetween={16}
                slidesPerView={1}
                pagination={{
                    clickable: true,
                    dynamicBullets: true,
                    bulletClass: 'swiper-pagination-bullet',
                    bulletActiveClass: 'swiper-pagination-bullet-active',
                }}
                className="ai-insights-swiper"
            >
                {/* Summary Card */}
                <SwiperSlide>
                    <div className="bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl p-4 sm:p-5 min-h-[12rem] sm:h-[16rem] md:h-[18rem] flex flex-col shadow-sm">
                        <div className="flex items-center mb-3">
                            <div className="bg-[rgba(var(--color-primary-rgb),0.1)] rounded-full p-2 mr-3 flex-shrink-0">
                                <SparklesIcon className="h-4 w-4 text-[rgb(var(--color-primary-rgb))]" />
                            </div>
                            <h3 className="font-semibold text-base text-[rgb(var(--color-text-rgb))]">Financial Summary</h3>
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <p className="text-[rgb(var(--color-text-muted-rgb))] text-sm leading-relaxed mb-3">{insights.summary}</p>
                            <div className="text-center">
                                <div className="text-lg font-bold text-[rgb(var(--color-primary-rgb))]">1</div>
                                <div className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Summary</div>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>

                {/* What's Going Well Card */}
                <SwiperSlide>
                    <div className="bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl p-4 sm:p-5 min-h-[12rem] sm:h-[16rem] md:h-[18rem] flex flex-col shadow-sm">
                        <div className="flex items-center mb-3">
                            <div className="bg-green-100 rounded-full p-2 mr-3 flex-shrink-0">
                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-base text-[rgb(var(--color-text-rgb))]">What's Going Well</h3>
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <ul className="space-y-1.5">
                                {insights.positivePoints.map((point, i) => (
                                    <li key={i} className="flex items-start text-sm text-[rgb(var(--color-text-muted-rgb))]">
                                        <div className="bg-green-200 rounded-full p-1 mr-2 mt-0.5 flex-shrink-0">
                                            <CheckCircleIcon className="h-3 w-3 text-green-600" />
                                        </div>
                                        <span className="leading-relaxed">{point}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="text-center mt-3">
                                <div className="text-lg font-bold text-green-600">2</div>
                                <div className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Strengths</div>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>

                {/* Areas to Watch Card */}
                <SwiperSlide>
                    <div className="bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl p-4 sm:p-5 min-h-[12rem] sm:h-[16rem] md:h-[18rem] flex flex-col shadow-sm">
                        <div className="flex items-center mb-3">
                            <div className="bg-amber-100 rounded-full p-2 mr-3 flex-shrink-0">
                                <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                            </div>
                            <h3 className="font-semibold text-base text-[rgb(var(--color-text-rgb))]">Areas to Watch</h3>
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <ul className="space-y-1.5">
                                {insights.areasForImprovement.map((point, i) => (
                                    <li key={i} className="flex items-start text-sm text-[rgb(var(--color-text-muted-rgb))]">
                                        <div className="bg-amber-200 rounded-full p-1 mr-2 mt-0.5 flex-shrink-0">
                                            <ExclamationTriangleIcon className="h-3 w-3 text-amber-600" />
                                        </div>
                                        <span className="leading-relaxed">{point}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="text-center mt-3">
                                <div className="text-lg font-bold text-amber-600">3</div>
                                <div className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Focus Areas</div>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>

                {/* Actionable Tip Card */}
                <SwiperSlide>
                    <div className="bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl p-4 sm:p-5 min-h-[12rem] sm:h-[16rem] md:h-[18rem] flex flex-col shadow-sm">
                        <div className="flex items-center mb-3">
                            <div className="bg-[rgba(var(--color-primary-rgb),0.1)] rounded-full p-2 mr-3 flex-shrink-0">
                                <LightBulbIcon className="h-4 w-4 text-[rgb(var(--color-primary-rgb))]" />
                            </div>
                            <h3 className="font-semibold text-base text-[rgb(var(--color-text-rgb))]">💡 Actionable Pro-Tip</h3>
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div className="bg-[rgba(var(--color-primary-rgb),0.1)] p-3 rounded-r-lg mb-3" style={{ borderLeftColor: 'rgb(var(--color-primary-rgb))', borderLeftWidth: '3px' }}>
                                <p className="text-[rgb(var(--color-text-muted-rgb))] text-sm leading-relaxed font-medium">{insights.actionableTip}</p>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-[rgb(var(--color-primary-rgb))]">4</div>
                                <div className="text-xs text-[rgb(var(--color-text-muted-rgb))]">Tip</div>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>
            </Swiper>

        </div>
    );
};

export default AISwiperCard;